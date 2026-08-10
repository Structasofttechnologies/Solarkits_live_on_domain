import axios from "axios";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiSave,
  FiRotateCcw,
  FiEye,
  FiMonitor,
  FiSmartphone,
  FiType,
  FiInfo,
  FiShield,
  FiSliders,
  FiZap,
} from "react-icons/fi";
import { FaCoins } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import * as LucideIcons from "lucide-react";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const ICON_OPTIONS = [
  { value: "CheckCircle", label: "Checkmark" },
  { value: "Sun", label: "Sun / Solar" },
  { value: "Star", label: "Star" },
  { value: "ShieldCheck", label: "Shield / Security" },
  { value: "Briefcase", label: "Briefcase" },
  { value: "HelpCircle", label: "Help / Support" },
  { value: "Boxes", label: "Boxes / Inventory" },
  { value: "TrendingUp", label: "Trending Up / Analytics" },
  { value: "Lock", label: "Lock" },
  { value: "Cpu", label: "CPU" },
  { value: "Zap", label: "Lightning" },
  { value: "Info", label: "Info" },
];

export default function PricingPlansConfig() {
  const [sectionInfo, setSectionInfo] = useState({
    sectionTitle: "Flexible Pricing Plans",
    sectionSubtitle: "Choose the plan that fits your solar business needs",
    sectionStatus: true,
  });
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [toast, setToast] = useState(null);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [activeTab, setActiveTab] = useState("general");

  const [modalForm, setModalForm] = useState({
    planName: "",
    price: "",
    duration: "per month",
    badgeText: "",
    badgeStatus: false,
    isPopular: false,
    cardBackgroundColor: "#ffffff",
    cardBorderColor: "#e5e7eb",
    planTitleColor: "#1f2937",
    priceColor: "#1f2937",
    featureHeadingColor: "#1f2937",
    featureTextColor: "#4b5563",
    softwareHeadingColor: "#ea580c",
    softwareTextColor: "#4b5563",
    buttonBackgroundColor: "#2563eb",
    buttonTextColor: "#ffffff",
    badgeBackgroundColor: "#8b5cf6",
    badgeTextColor: "#ffffff",
    buttonText: "Get Started",
    buttonLink: "/login",
    featureSectionTitle: "Features",
    features: [],
    softwareSectionTitle: "Solar Software Included",
    softwareIncluded: [],
    displayOrder: 0,
    status: "Active",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    setLoading(true);
    try {
      // GET API Call: Fetch all pricing plans and section header configuration
      const res = await axios.get(`${BASE_URL}/api/website/v1/pricing-plans/get?t=${Date.now()}`);
      if (res.data?.success) {
        if (res.data.section) {
          setSectionInfo(res.data.section);
        }
        if (res.data.plans) {
          setPlans(res.data.plans);
        }
      }
    } catch (error) {
      console.error("Error loading pricing plans:", error);
      showToast("Failed to load pricing configurations.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSectionInfo((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveSectionSettings = async () => {
    if (plans.length === 0) {
      showToast("Please add at least one plan card to save settings.", "error");
      return;
    }
    setIsSavingSection(true);
    try {
      const targetPlan = plans[0];
      // PUT API Call: Update Section Header Settings using the first plan's ID
      const res = await axios.put(`${BASE_URL}/api/website/v1/pricing-plans/update/${targetPlan._id}`, {
        ...targetPlan,
        ...sectionInfo,
      });
      if (res.data?.success) {
        showToast("Section header settings saved successfully!");
        fetchPricingData();
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to save section settings.", "error");
    } finally {
      setIsSavingSection(false);
    }
  };

  const handleModalFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setModalForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingPlanId(null);
    setActiveTab("general");
    setModalForm({
      planName: "",
      price: "",
      duration: "per month",
      badgeText: "MOST POPULAR",
      badgeStatus: false,
      isPopular: false,
      cardBackgroundColor: "#ffffff",
      cardBorderColor: "#e5e7eb",
      planTitleColor: "#1f2937",
      priceColor: "#1f2937",
      featureHeadingColor: "#1f2937",
      featureTextColor: "#4b5563",
      softwareHeadingColor: "#ea580c",
      softwareTextColor: "#4b5563",
      buttonBackgroundColor: "#2563eb",
      buttonTextColor: "#ffffff",
      badgeBackgroundColor: "#8b5cf6",
      badgeTextColor: "#ffffff",
      buttonText: "Get Started",
      buttonLink: "/login",
      featureSectionTitle: "Features",
      features: [
        { title: "Example Feature", icon: "CheckCircle", sortOrder: 1, status: true },
      ],
      softwareSectionTitle: "Solar Software Included",
      softwareIncluded: [
        { title: "Solar Dealer App", icon: "Sun", sortOrder: 1, status: true },
      ],
      displayOrder: plans.length + 1,
      status: "Active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setIsEditMode(true);
    setEditingPlanId(plan._id);
    setActiveTab("general");
    setModalForm({
      ...plan,
      features: plan.features || [],
      softwareIncluded: plan.softwareIncluded || [],
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (planId, currentStatus) => {
    try {
      const nextStatus = currentStatus === "Active" ? "Inactive" : "Active";
      // PATCH API Call: Toggle the status of a specific pricing plan (Active/Inactive)
      const res = await axios.patch(`${BASE_URL}/api/website/v1/pricing-plans/status/${planId}`, {
        status: nextStatus,
      });
      if (res.data?.success) {
        showToast(`Plan status updated to ${nextStatus}!`);
        setPlans((prev) =>
          prev.map((p) => (p._id === planId ? { ...p, status: nextStatus } : p))
        );
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to toggle plan status.", "error");
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this pricing plan?")) return;
    try {
      // DELETE API Call: Delete a specific pricing plan card by ID
      const res = await axios.delete(`${BASE_URL}/api/website/v1/pricing-plans/delete/${planId}`);
      if (res.data?.success) {
        showToast("Pricing plan deleted successfully!");
        setPlans((prev) => prev.filter((p) => p._id !== planId));
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to delete pricing plan.", "error");
    }
  };

  // Features Actions
  const handleAddFeatureField = () => {
    setModalForm((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        { title: "", icon: "CheckCircle", sortOrder: prev.features.length + 1, status: true },
      ],
    }));
  };

  const handleFeatureFieldChange = (index, field, value) => {
    setModalForm((prev) => {
      const updated = [...prev.features];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, features: updated };
    });
  };

  const handleRemoveFeatureField = (index) => {
    setModalForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== index),
    }));
  };

  // Software Actions
  const handleAddSoftwareField = () => {
    setModalForm((prev) => ({
      ...prev,
      softwareIncluded: [
        ...prev.softwareIncluded,
        { title: "", icon: "Sun", sortOrder: prev.softwareIncluded.length + 1, status: true },
      ],
    }));
  };

  const handleSoftwareFieldChange = (index, field, value) => {
    setModalForm((prev) => {
      const updated = [...prev.softwareIncluded];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, softwareIncluded: updated };
    });
  };

  const handleRemoveSoftwareField = (index) => {
    setModalForm((prev) => ({
      ...prev,
      softwareIncluded: prev.softwareIncluded.filter((_, idx) => idx !== index),
    }));
  };

  // Save Modal Form
  const handleSaveModal = async (e) => {
    e.preventDefault();

    if (!modalForm.planName.trim()) {
      showToast("Plan Name is required.", "error");
      return;
    }
    if (!modalForm.price.trim()) {
      showToast("Price is required.", "error");
      return;
    }

    try {
      const payload = {
        ...modalForm,
        ...sectionInfo,
      };

      let res;
      if (isEditMode) {
        // PUT API Call: Update an existing pricing plan card by ID
        res = await axios.put(`${BASE_URL}/api/website/v1/pricing-plans/update/${editingPlanId}`, payload);
      } else {
        // POST API Call: Create a new pricing plan card
        res = await axios.post(`${BASE_URL}/api/website/v1/pricing-plans/create`, payload);
      }

      if (res.data?.success) {
        showToast(isEditMode ? "Pricing plan updated successfully!" : "Pricing plan created successfully!");
        setIsModalOpen(false);
        fetchPricingData();
      }
    } catch (error) {
      console.error(error);
      const backendErrors = error.response?.data?.errors;
      if (backendErrors) {
        const errorMsg = Object.values(backendErrors).join(" | ");
        showToast(`Save Error: ${errorMsg}`, "error");
      } else {
        showToast("Failed to save pricing plan configuration.", "error");
      }
    }
  };

  // Icon Render Helper
  const renderLucideIcon = (iconName, color, className) => {
    const IconComp = LucideIcons[iconName] || LucideIcons.CheckCircle;
    return <IconComp className={className} style={{ color }} />;
  };

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="Pricing Plans Configuration"
        subtitle="Manage and customize your website's Pricing Plans section."
        icon={FaCoins}
        stats={[
          {
            label: "Visibility",
            value: sectionInfo.sectionStatus ? "Active" : "Disabled",
            description: sectionInfo.sectionStatus ? "Visible on live site" : "Hidden from site",
          },
          {
            label: "Active plans",
            value: `${plans.filter((p) => p.status === "Active").length} plans`,
            description: "Currently live on site",
          },
          {
            label: "Total plans",
            value: `${plans.length} plans`,
            description: "Total configured offerings",
          },
        ]}
      />

      {/* Success Notification Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between shadow-lg backdrop-blur-md ${
              toast.type === "error"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === "error" ? (
                <FiXCircle className="text-xl shrink-0" />
              ) : (
                <FiCheckCircle className="text-xl shrink-0" />
              )}
              <div>
                <p className="font-semibold text-sm">
                  {toast.type === "error" ? "Action Failed" : "Success"}
                </p>
                <p className="text-xs opacity-80">{toast.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-xs font-semibold px-3 py-1 rounded-lg transition hover:bg-slate-200/20"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Left Column (7 cols) - Editor Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section Info Card */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <HiSparkles className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">Section Header</h2>
                  <p className="text-xs text-text/60">Configure Title and Subtitle for the Pricing Section</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5 mb-2">
                    <FiType className="text-primary text-sm" /> Section Title
                  </label>
                  <input
                    type="text"
                    name="sectionTitle"
                    value={sectionInfo.sectionTitle}
                    onChange={handleSectionChange}
                    placeholder="e.g. Flexible Pricing Plans"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5 mb-2">
                    <FiInfo className="text-primary text-sm" /> Section Subtitle
                  </label>
                  <input
                    type="text"
                    name="sectionSubtitle"
                    value={sectionInfo.sectionSubtitle}
                    onChange={handleSectionChange}
                    placeholder="e.g. Choose the plan that fits..."
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Status Switch Card */}
              <div className="pt-2">
                <div
                  onClick={() =>
                    setSectionInfo((prev) => ({ ...prev, sectionStatus: !prev.sectionStatus }))
                  }
                  className={`cursor-pointer border rounded-2xl p-4 md:p-5 flex items-center justify-between transition-all duration-300 ${
                    sectionInfo.sectionStatus
                      ? "bg-primary/5 border-primary/40 shadow-sm"
                      : "bg-bg/40 border-border/60 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        sectionInfo.sectionStatus ? "bg-primary text-white" : "bg-border/40 text-text/50"
                      }`}
                    >
                      <FiShield className="text-lg" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-text">Section Visibility</h4>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            sectionInfo.sectionStatus
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {sectionInfo.sectionStatus ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-xs text-text/60 mt-0.5">
                        Toggle whether this section is displayed on the live website.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                      sectionInfo.sectionStatus ? "bg-primary" : "bg-border"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${
                        sectionInfo.sectionStatus ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Pricing Cards List Configured */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-5 mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  Configured Plans
                </h3>
                <p className="text-xs text-text/60 mt-0.5">Manage and display customized plan cards</p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-md active:scale-[0.97] self-start"
              >
                <FiPlus className="h-4 w-4" />
                Add New Plan
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-16 flex-col gap-3">
                <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
                <span className="text-xs text-text/60 font-semibold">Loading plan configurations...</span>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                <FaCoins className="h-10 w-10 text-text/30 mx-auto mb-3 animate-bounce" />
                <p className="text-text/70 font-semibold text-sm">No plans configured yet.</p>
                <button
                  onClick={handleOpenAddModal}
                  className="mt-3 text-xs font-bold text-primary hover:underline"
                >
                  Create your first plan card
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan, idx) => {
                  const cardThemeColor = plan.planTitleColor || "#1f2937";
                  return (
                    <div
                      key={plan._id || idx}
                      className={`border border-border/50 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all bg-bg/20 ${
                        plan.status === "Inactive" ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0"
                          style={{ backgroundColor: cardThemeColor }}
                        >
                          {plan.planName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-text">{plan.planName}</h4>
                            <span
                              className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                                plan.status === "Active"
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                  : "bg-slate-500/10 text-slate-600 border border-slate-500/20"
                              }`}
                            >
                              {plan.status}
                            </span>
                            {plan.isPopular && (
                              <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 border border-purple-500/20">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text/60 mt-0.5">
                            Price: <strong className="text-text">{plan.price}</strong> /{plan.duration} |
                            Order: {plan.displayOrder}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0 justify-end">
                        <button
                          onClick={() => handleOpenEditModal(plan)}
                          className="flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg/50 hover:bg-border/20 text-xs font-semibold text-text border border-border/60 transition-colors"
                        >
                          <FiEdit2 className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(plan._id, plan.status)}
                          className="p-1.5 rounded-lg bg-bg/50 hover:bg-border/20 border border-border/60 text-text/80 transition-colors"
                          title={plan.status === "Active" ? "Disable Plan" : "Enable Plan"}
                        >
                          {plan.status === "Active" ? (
                            <FiXCircle className="h-4 w-4 text-rose-500" />
                          ) : (
                            <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan._id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 transition-colors"
                          title="Delete Plan"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Save Settings Action */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={saveSectionSettings}
              disabled={isSavingSection}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <FiSave className="text-base" />
              {isSavingSection ? "Saving..." : "Save Header Settings"}
            </button>
          </div>
        </div>

        {/* Right Column (5 cols) - Sticky Live Preview */}
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

            {/* Mock Viewport Container */}
            <div
              className={`mx-auto transition-all duration-300 overflow-hidden ${
                previewMode === "mobile"
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
                  solarkits.com/pricing
                </span>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      sectionInfo.sectionStatus ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                </div>
              </div>

              {/* Exact Mock Canvas matching the pricing design */}
              <div
                className={`relative bg-gradient-to-br from-blue-50/20 via-white to-orange-50/20 p-4 md:p-6 overflow-hidden min-h-[420px] max-h-[500px] overflow-y-auto ${
                  !sectionInfo.sectionStatus ? "opacity-40 grayscale" : ""
                }`}
              >
                <div className="text-center mb-6">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight leading-tight">
                    {sectionInfo.sectionTitle || "Flexible Pricing Plans"}
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">
                    {sectionInfo.sectionSubtitle || "Choose the plan that fits your solar business needs"}
                  </p>
                </div>

                {/* Plans List inside Canvas */}
                <div
                  className={`mt-4 ${
                    previewMode === "desktop"
                      ? "flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-slate-200"
                      : "flex flex-col gap-4"
                  }`}
                >
                  {plans.filter(p => p.status === "Active").map((plan, idx) => {
                    const isPopularCard = plan.isPopular;
                    const shadowStyle = isPopularCard
                      ? {
                          boxShadow: `0 0 0 3px ${plan.cardBorderColor}33, 0 8px 12px -2px rgba(0, 0, 0, 0.08)`,
                        }
                      : {};

                    const cardStyle = {
                      backgroundColor: plan.cardBackgroundColor || "#ffffff",
                      borderColor: plan.cardBorderColor || "#e5e7eb",
                      ...shadowStyle,
                    };

                    return (
                      <div
                        key={plan._id || idx}
                        style={cardStyle}
                        className={`relative rounded-2xl p-4 text-left border flex flex-col justify-between shrink-0 select-none transition-all duration-300 ${
                          previewMode === "desktop" ? "w-[210px]" : "w-full"
                        }`}
                      >
                        {/* Popular Badge */}
                        {isPopularCard && plan.badgeStatus && (
                          <div
                            className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[9px] font-black tracking-wider uppercase shadow-sm whitespace-nowrap"
                            style={{
                              backgroundColor: plan.badgeBackgroundColor || "#8b5cf6",
                              color: plan.badgeTextColor || "#ffffff",
                            }}
                          >
                            {plan.badgeText || "POPULAR"}
                          </div>
                        )}

                        <div>
                          {/* Title & Price */}
                          <div className="text-center pb-4 border-b border-slate-100">
                            <h3
                              className="text-sm font-black uppercase tracking-wide"
                              style={{ color: plan.planTitleColor || "#1f2937" }}
                            >
                              {plan.planName}
                            </h3>
                            <div className="mt-2 flex items-baseline justify-center">
                              <span
                                className="text-xl font-extrabold tracking-tight"
                                style={{ color: plan.priceColor || "#1f2937" }}
                              >
                                {plan.price}
                              </span>
                              {plan.duration && (
                                <span className="ml-0.5 text-[9px] font-semibold text-slate-400">
                                  /{plan.duration}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Features */}
                          <div className="py-4">
                            <span
                              className="text-[9px] font-black uppercase tracking-wider block"
                              style={{ color: plan.featureHeadingColor || "#1f2937" }}
                            >
                              {plan.featureSectionTitle || "Features"}
                            </span>
                            <ul className="mt-2.5 space-y-2">
                              {plan.features
                                ?.filter((feat) => feat.status !== false)
                                ?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                                ?.map((feat, fidx) => (
                                  <li key={fidx} className="flex items-start gap-1.5">
                                    {renderLucideIcon(feat.icon, plan.planTitleColor || "#10b981", "h-3.5 w-3.5 flex-shrink-0 mt-0.5")}
                                    <span
                                      className="text-[10px] font-medium leading-tight"
                                      style={{ color: plan.featureTextColor || "#4b5563" }}
                                    >
                                      {feat.title}
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </div>

                        <div>
                          {/* Software Box */}
                          {plan.softwareIncluded && plan.softwareIncluded.length > 0 && (
                            <div
                              className="mb-4 rounded-xl p-2"
                              style={{
                                backgroundColor: `${plan.softwareHeadingColor || "#ea580c"}0d`,
                                border: `1px solid ${plan.softwareHeadingColor || "#ea580c"}26`,
                              }}
                            >
                              <div
                                className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider mb-1.5"
                                style={{ color: plan.softwareHeadingColor || "#ea580c" }}
                              >
                                <LucideIcons.Sun
                                  className="h-3.5 w-3.5 flex-shrink-0"
                                  style={{ color: plan.softwareHeadingColor || "#ea580c" }}
                                />
                                <span>{plan.softwareSectionTitle || "Software Included"}</span>
                              </div>
                              <ul className="space-y-1">
                                {plan.softwareIncluded
                                  ?.filter((sw) => sw.status !== false)
                                  ?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                                  ?.map((sw, sidx) => (
                                    <li
                                      key={sidx}
                                      className="text-[10px] font-semibold flex items-center gap-1"
                                      style={{ color: plan.softwareTextColor || "#4b5563" }}
                                    >
                                      {renderLucideIcon(sw.icon, plan.softwareHeadingColor || "#ea580c", "h-3 w-3 flex-shrink-0")}
                                      <span className="leading-tight">{sw.title}</span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}

                          {/* CTA Button */}
                          <div
                            className="w-full text-center py-2.5 rounded-xl font-bold text-[10px] shadow-sm select-none"
                            style={{
                              backgroundColor: plan.buttonBackgroundColor || "#2563eb",
                              color: plan.buttonTextColor || "#ffffff",
                            }}
                          >
                            {plan.buttonText || "Get Started"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Disabled Overlay Banner if Section Disabled */}
              {!sectionInfo.sectionStatus && (
                <div className="bg-rose-500/10 border-t border-rose-500/30 p-2.5 text-center mt-3 rounded-lg">
                  <span className="text-[10px] font-semibold text-rose-500 flex items-center justify-center gap-1.5">
                    <FiXCircle /> Section Disabled - Hidden on Website
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PLAN CARD ADD/EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 bg-bg/50 border-b border-border/50">
                <div>
                  <h3 className="text-lg font-bold text-text">
                    {isEditMode ? `Edit Plan: ${modalForm.planName}` : "Add New Pricing Plan"}
                  </h3>
                  <p className="text-xs text-text/60 mt-0.5">Customize plan card styles and options</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-border/40 text-text/60 transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border/40 px-6 bg-bg/30">
                {[
                  { id: "general", label: "General & Styles" },
                  { id: "features", label: `Features (${modalForm.features?.length || 0})` },
                  { id: "software", label: `Software (${modalForm.softwareIncluded?.length || 0})` },
                  { id: "actions", label: "CTA Button & Sorting" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-text/50 hover:text-text/80"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleSaveModal} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* TAB 1: GENERAL & STYLE */}
                {activeTab === "general" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-text/80 uppercase tracking-wider mb-2">
                          Plan Name *
                        </label>
                        <input
                          type="text"
                          name="planName"
                          value={modalForm.planName}
                          onChange={handleModalFormChange}
                          required
                          className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                          placeholder="e.g. Free, Starter, Business"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-text/80 uppercase tracking-wider mb-2">
                          Price *
                        </label>
                        <input
                          type="text"
                          name="price"
                          value={modalForm.price}
                          onChange={handleModalFormChange}
                          required
                          className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                          placeholder="e.g. ₹99,999 or Custom"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-text/80 uppercase tracking-wider mb-2">
                          Duration
                        </label>
                        <input
                          type="text"
                          name="duration"
                          value={modalForm.duration}
                          onChange={handleModalFormChange}
                          className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                          placeholder="e.g. per month, forever, contact sales"
                        />
                      </div>
                    </div>

                    {/* Popular settings */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-bg/50 rounded-2xl border border-border/40">
                      <div className="flex items-center gap-2 md:col-span-1">
                        <input
                          type="checkbox"
                          id="isPopular"
                          name="isPopular"
                          checked={modalForm.isPopular}
                          onChange={handleModalFormChange}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                        />
                        <label htmlFor="isPopular" className="text-xs font-bold text-text/80 cursor-pointer">
                          Mark as Popular Plan
                        </label>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-text/50 uppercase tracking-wider mb-1">
                          Popular Badge Text
                        </label>
                        <input
                          type="text"
                          name="badgeText"
                          value={modalForm.badgeText}
                          onChange={handleModalFormChange}
                          disabled={!modalForm.isPopular}
                          className="w-full bg-bg/40 border border-border/60 rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none disabled:opacity-50"
                          placeholder="e.g. MOST POPULAR"
                        />
                      </div>

                      <div className="flex items-center gap-2 md:col-span-1">
                        <input
                          type="checkbox"
                          id="badgeStatus"
                          name="badgeStatus"
                          checked={modalForm.badgeStatus}
                          onChange={handleModalFormChange}
                          disabled={!modalForm.isPopular}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                        />
                        <label htmlFor="badgeStatus" className="text-xs font-bold text-text/80 cursor-pointer disabled:opacity-50">
                          Show Badge Text
                        </label>
                      </div>
                    </div>

                    {/* Colors settings */}
                    <div>
                      <h4 className="text-xs font-black text-text/50 uppercase tracking-wider border-b border-border/30 pb-2 mb-4">
                        Custom Colors & Themes
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                          { label: "Card BG", name: "cardBackgroundColor" },
                          { label: "Border Color", name: "cardBorderColor" },
                          { label: "Title Color", name: "planTitleColor" },
                          { label: "Price Color", name: "priceColor" },
                          { label: "Badge BG", name: "badgeBackgroundColor" },
                          { label: "Badge Text", name: "badgeTextColor" },
                        ].map((col) => (
                          <div key={col.name}>
                            <label className="block text-[10px] font-bold text-text/70 uppercase mb-1">
                              {col.label}
                            </label>
                            <div className="flex gap-2 items-center bg-bg/40 border border-border/70 p-1.5 rounded-lg">
                              <input
                                type="color"
                                name={col.name}
                                value={modalForm[col.name]}
                                onChange={handleModalFormChange}
                                className="h-7 w-7 border border-border/60 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                name={col.name}
                                value={modalForm[col.name]}
                                onChange={handleModalFormChange}
                                className="w-16 bg-transparent text-[10px] font-mono text-text focus:outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: FEATURES */}
                {activeTab === "features" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-bg/40 p-4 rounded-xl border border-border/40">
                      <div>
                        <label className="block text-xs font-bold text-text/80 uppercase tracking-wider mb-2">
                          Feature Section Title
                        </label>
                        <input
                          type="text"
                          name="featureSectionTitle"
                          value={modalForm.featureSectionTitle}
                          onChange={handleModalFormChange}
                          className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                          placeholder="e.g. FEATURES"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-text/80 uppercase tracking-wider mb-2">
                          Feature Title Color
                        </label>
                        <div className="flex gap-2 items-center bg-bg/40 border border-border/70 p-1.5 rounded-lg">
                          <input
                            type="color"
                            name="featureHeadingColor"
                            value={modalForm.featureHeadingColor}
                            onChange={handleModalFormChange}
                            className="h-8 w-8 border border-border/60 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            name="featureHeadingColor"
                            value={modalForm.featureHeadingColor}
                            onChange={handleModalFormChange}
                            className="flex-1 bg-transparent text-xs font-mono text-text focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-text/80 uppercase tracking-wider mb-2">
                          Feature Text Color
                        </label>
                        <div className="flex gap-2 items-center bg-bg/40 border border-border/70 p-1.5 rounded-lg">
                          <input
                            type="color"
                            name="featureTextColor"
                            value={modalForm.featureTextColor}
                            onChange={handleModalFormChange}
                            className="h-8 w-8 border border-border/60 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            name="featureTextColor"
                            value={modalForm.featureTextColor}
                            onChange={handleModalFormChange}
                            className="flex-1 bg-transparent text-xs font-mono text-text focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-text">Features Checklist</h4>
                        <button
                          type="button"
                          onClick={handleAddFeatureField}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
                        >
                          <FiPlus className="h-3.5 w-3.5" />
                          Add Feature
                        </button>
                      </div>

                      {modalForm.features?.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-border rounded-xl">
                          <p className="text-xs text-text/50">No features configured. Add features to build the list.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {modalForm.features.map((feat, fidx) => (
                            <div
                              key={fidx}
                              className="grid grid-cols-12 gap-3 items-center p-3 bg-bg/30 border border-border/50 rounded-xl"
                            >
                              <div className="col-span-6">
                                <input
                                  type="text"
                                  value={feat.title}
                                  onChange={(e) => handleFeatureFieldChange(fidx, "title", e.target.value)}
                                  className="w-full bg-bg/50 border border-border/70 px-3 py-1.5 text-xs text-text rounded-lg focus:outline-none"
                                  placeholder="e.g. Solar design simulation"
                                />
                              </div>

                              <div className="col-span-3">
                                <select
                                  value={feat.icon}
                                  onChange={(e) => handleFeatureFieldChange(fidx, "icon", e.target.value)}
                                  className="w-full bg-bg/50 border border-border/70 px-2 py-1.5 text-xs text-text rounded-lg focus:outline-none"
                                >
                                  {ICON_OPTIONS.map((ico) => (
                                    <option key={ico.value} value={ico.value}>
                                      {ico.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="col-span-1">
                                <input
                                  type="number"
                                  value={feat.sortOrder || 0}
                                  onChange={(e) =>
                                    handleFeatureFieldChange(fidx, "sortOrder", parseInt(e.target.value) || 0)
                                  }
                                  className="w-full bg-bg/50 border border-border/70 px-1 py-1.5 text-xs text-center text-text rounded-lg"
                                  title="Display Sequence"
                                />
                              </div>

                              <div className="col-span-1 flex justify-center">
                                <input
                                  type="checkbox"
                                  checked={feat.status}
                                  onChange={(e) => handleFeatureFieldChange(fidx, "status", e.target.checked)}
                                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                                  title="Is Active?"
                                />
                              </div>

                              <div className="col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFeatureField(fidx)}
                                  className="p-1.5 rounded bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: SOFTWARE */}
                {activeTab === "software" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-bg/40 p-4 rounded-xl border border-border/40">
                      <div>
                        <label className="block text-xs font-bold text-text/80 uppercase tracking-wider mb-2">
                          Software Section Title
                        </label>
                        <input
                          type="text"
                          name="softwareSectionTitle"
                          value={modalForm.softwareSectionTitle}
                          onChange={handleModalFormChange}
                          className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                          placeholder="e.g. Solar Software Included"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-text/80 uppercase tracking-wider mb-2">
                          Software Title Color
                        </label>
                        <div className="flex gap-2 items-center bg-bg/40 border border-border/70 p-1.5 rounded-lg">
                          <input
                            type="color"
                            name="softwareHeadingColor"
                            value={modalForm.softwareHeadingColor}
                            onChange={handleModalFormChange}
                            className="h-8 w-8 border border-border/60 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            name="softwareHeadingColor"
                            value={modalForm.softwareHeadingColor}
                            onChange={handleModalFormChange}
                            className="flex-1 bg-transparent text-xs font-mono text-text focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-text/80 uppercase tracking-wider mb-2">
                          Software Text Color
                        </label>
                        <div className="flex gap-2 items-center bg-bg/40 border border-border/70 p-1.5 rounded-lg">
                          <input
                            type="color"
                            name="softwareTextColor"
                            value={modalForm.softwareTextColor}
                            onChange={handleModalFormChange}
                            className="h-8 w-8 border border-border/60 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            name="softwareTextColor"
                            value={modalForm.softwareTextColor}
                            onChange={handleModalFormChange}
                            className="flex-1 bg-transparent text-xs font-mono text-text focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-text">Solar Software Packages Included</h4>
                        <button
                          type="button"
                          onClick={handleAddSoftwareField}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-xs font-bold transition-colors"
                        >
                          <FiPlus className="h-3.5 w-3.5" />
                          Add Software
                        </button>
                      </div>

                      {modalForm.softwareIncluded?.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-border rounded-xl">
                          <p className="text-xs text-text/50">No software items configured yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {modalForm.softwareIncluded.map((sw, sidx) => (
                            <div
                              key={sidx}
                              className="grid grid-cols-12 gap-3 items-center p-3 bg-bg/30 border border-border/50 rounded-xl"
                            >
                              <div className="col-span-6">
                                <input
                                  type="text"
                                  value={sw.title}
                                  onChange={(e) => handleSoftwareFieldChange(sidx, "title", e.target.value)}
                                  className="w-full bg-bg/50 border border-border/70 px-3 py-1.5 text-xs text-text rounded-lg focus:outline-none"
                                  placeholder="e.g. Solar Business ERP"
                                />
                              </div>

                              <div className="col-span-3">
                                <select
                                  value={sw.icon}
                                  onChange={(e) => handleSoftwareFieldChange(sidx, "icon", e.target.value)}
                                  className="w-full bg-bg/50 border border-border/70 px-2 py-1.5 text-xs text-text rounded-lg focus:outline-none"
                                >
                                  {ICON_OPTIONS.map((ico) => (
                                    <option key={ico.value} value={ico.value}>
                                      {ico.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="col-span-1">
                                <input
                                  type="number"
                                  value={sw.sortOrder || 0}
                                  onChange={(e) =>
                                    handleSoftwareFieldChange(sidx, "sortOrder", parseInt(e.target.value) || 0)
                                  }
                                  className="w-full bg-bg/50 border border-border/70 px-1 py-1.5 text-xs text-center text-text rounded-lg"
                                  title="Display Sequence"
                                />
                              </div>

                              <div className="col-span-1 flex justify-center">
                                <input
                                  type="checkbox"
                                  checked={sw.status}
                                  onChange={(e) => handleSoftwareFieldChange(sidx, "status", e.target.checked)}
                                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                                  title="Is Active?"
                                />
                              </div>

                              <div className="col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSoftwareField(sidx)}
                                  className="p-1.5 rounded bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: CTA BUTTON & OTHER */}
                {activeTab === "actions" && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-text/50 uppercase tracking-wider border-b border-border/30 pb-2 mb-4">
                        Call-To-Action Button Customization
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-text/80 uppercase tracking-wider mb-2">
                            Button Text
                          </label>
                          <input
                            type="text"
                            name="buttonText"
                            value={modalForm.buttonText}
                            onChange={handleModalFormChange}
                            className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                            placeholder="e.g. Get Started, Sign Up"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-text/80 uppercase tracking-wider mb-2">
                            Button Link URL
                          </label>
                          <input
                            type="text"
                            name="buttonLink"
                            value={modalForm.buttonLink}
                            onChange={handleModalFormChange}
                            className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                            placeholder="e.g. /login or absolute URL"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-text/80 uppercase tracking-wider mb-2">
                            Button BG Color
                          </label>
                          <div className="flex gap-2 items-center bg-bg/40 border border-border/70 p-1.5 rounded-lg">
                            <input
                              type="color"
                              name="buttonBackgroundColor"
                              value={modalForm.buttonBackgroundColor}
                              onChange={handleModalFormChange}
                              className="h-8 w-8 border border-border/60 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              name="buttonBackgroundColor"
                              value={modalForm.buttonBackgroundColor}
                              onChange={handleModalFormChange}
                              className="flex-1 bg-transparent text-xs font-mono text-text focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-text/80 uppercase tracking-wider mb-2">
                            Button Text Color
                          </label>
                          <div className="flex gap-2 items-center bg-bg/40 border border-border/70 p-1.5 rounded-lg">
                            <input
                              type="color"
                              name="buttonTextColor"
                              value={modalForm.buttonTextColor}
                              onChange={handleModalFormChange}
                              className="h-8 w-8 border border-border/60 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              name="buttonTextColor"
                              value={modalForm.buttonTextColor}
                              onChange={handleModalFormChange}
                              className="flex-1 bg-transparent text-xs font-mono text-text focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-text/50 uppercase tracking-wider border-b border-border/30 pb-2 mb-4">
                        Sorting & Status
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-text/80 uppercase tracking-wider mb-2">
                            Display Sort Order
                          </label>
                          <input
                            type="number"
                            name="displayOrder"
                            value={modalForm.displayOrder}
                            onChange={handleModalFormChange}
                            className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                            placeholder="e.g. 1, 2, 3"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-text/80 uppercase tracking-wider mb-2">
                            Plan Status
                          </label>
                          <select
                            name="status"
                            value={modalForm.status}
                            onChange={handleModalFormChange}
                            className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 bg-card"
                          >
                            <option value="Active">Active (Live on Website)</option>
                            <option value="Inactive">Inactive (Hidden)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 bg-bg/50 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border/60 hover:bg-border/30 text-text/80 text-xs font-bold transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
