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
  FiList
} from "react-icons/fi";
import { HiSparkles, HiCube } from "react-icons/hi";

const INITIAL_ERP_MODULES = [
  { id: "finance", order: 1, title: "Finance & Accounting", desc: "General ledger, accounts payable/receivable, budgeting, and financial reporting", icon: "Wallet", status: "Active" },
  { id: "inventory", order: 2, title: "Inventory Management", desc: "Stock control, warehouse management, batch tracking, and reorder management", icon: "Boxes", status: "Active" },
  { id: "hr", order: 3, title: "HR Management", desc: "Employee records, attendance, leave management, and performance tracking", icon: "Users", status: "Active" },
  { id: "payroll", order: 4, title: "Payroll", desc: "Salary processing, tax calculations, deductions, and payslip generation", icon: "CreditCard", status: "Active" },
  { id: "procurement", order: 5, title: "Procurement", desc: "Purchase orders, vendor management, RFQs, and contract management", icon: "ShoppingCart", status: "Active" },
  { id: "production", order: 6, title: "Production", desc: "Manufacturing planning, BOM, work orders, and quality control", icon: "Factory", status: "Active" },
  { id: "sales", order: 7, title: "Sales & CRM", desc: "Lead management, quotations, sales orders, and customer relationship", icon: "Users", status: "Active" },
  { id: "bi", order: 8, title: "Business Intelligence", desc: "Advanced analytics, dashboards, reports, and predictive insights", icon: "BarChart3", status: "Active" },
  { id: "project", order: 9, title: "Project Management", desc: "Project planning, resource allocation, task tracking, and time sheets", icon: "ClipboardList", status: "Active" },
  { id: "supply", order: 10, title: "Supply Chain", desc: "Logistics, shipment tracking, fleet management, and route optimization", icon: "Truck", status: "Active" },
  { id: "support", order: 11, title: "Customer Support", desc: "Ticket system, service requests, warranty management, and feedback", icon: "HelpCircle", status: "Active" },
  { id: "compliance", order: 12, title: "Compliance", desc: "Regulatory compliance, audit trails, document management, and security", icon: "ShieldCheck", status: "Active" }
];

const DEFAULT_CONFIG = {
  menuTitle: "Comprehensive ERP Modules",
  subTitle: "Everything you need to run your business efficiently",
  menuType: "Grid",
  enableSection: true,
  modules: INITIAL_ERP_MODULES,
  lastUpdated: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function ErpModulesConfig() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Edit / Add Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null); // null when adding
  const [modalForm, setModalForm] = useState({
    title: "",
    desc: "",
    icon: "Wallet",
    order: 1,
    status: "Active"
  });

  useEffect(() => {
    fetchErpModulesConfig();
  }, []);

  const fetchErpModulesConfig = async () => {
    try {
      let response;
      try {
        // API Call: GET /api/website/v1/erp-modules/get - Fetch ERP Modules configuration
        response = await axios.get(`${BASE_URL}/api/website/v1/erp-modules/get?t=${Date.now()}`);
      } catch (err) {
        // API Call: GET /api/erp-modules/get - Fallback fetch ERP Modules configuration
        response = await axios.get(`${BASE_URL}/api/erp-modules/get?t=${Date.now()}`);
      }

      if (response.data?.data) {
        const dbModules = response.data.data.modules;
        setFormData((prev) => ({
          ...prev,
          ...response.data.data,
          modules: (Array.isArray(dbModules) && dbModules.length > 0)
            ? dbModules
            : INITIAL_ERP_MODULES
        }));
      }
    } catch (error) {
      console.log("Using default ERP modules configuration:", error.message);
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

  const handleToggleEnable = () => {
    setFormData((prev) => ({ ...prev, enableSection: !prev.enableSection }));
    setSavedSuccess(false);
  };

  const handleReset = () => {
    setFormData(DEFAULT_CONFIG);
    setSavedSuccess(false);
  };

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingModule(null);
    setModalForm({
      title: "",
      desc: "",
      icon: "Wallet",
      order: formData.modules.length + 1,
      status: "Active"
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item) => {
    setEditingModule(item);
    setModalForm({
      title: item.title || "",
      desc: item.desc || "",
      icon: item.icon || "Wallet",
      order: item.order || 1,
      status: item.status || "Active"
    });
    setIsModalOpen(true);
  };

  // Delete Module Item
  const handleDeleteModule = (id) => {
    if (confirm("Are you sure you want to delete this ERP module?")) {
      setFormData((prev) => ({
        ...prev,
        modules: prev.modules.filter((item) => item.id !== id)
      }));
      setSavedSuccess(false);
    }
  };

  // Save Modal Form (Add or Edit)
  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!modalForm.title.trim()) {
      alert("Please enter module title");
      return;
    }

    if (editingModule) {
      // Update existing
      setFormData((prev) => ({
        ...prev,
        modules: prev.modules.map((item) =>
          item.id === editingModule.id
            ? { ...item, ...modalForm, order: Number(modalForm.order) || 1 }
            : item
        )
      }));
    } else {
      // Add new
      const newItem = {
        id: `erp-${Date.now()}`,
        order: Number(modalForm.order) || (formData.modules.length + 1),
        title: modalForm.title,
        desc: modalForm.desc,
        icon: modalForm.icon,
        status: modalForm.status
      };
      setFormData((prev) => ({
        ...prev,
        modules: [...prev.modules, newItem]
      }));
    }

    setIsModalOpen(false);
    setSavedSuccess(false);
  };

  // Submit main form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        lastUpdated: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
      };

      // API Call: POST /api/website/v1/erp-modules/save - Save/Update ERP Modules configuration
      await axios.post(`${BASE_URL}/api/website/v1/erp-modules/save`, payload);

      setFormData(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (error) {
      console.error("Failed to save ERP Modules Configuration:", error);
      alert("Failed to save ERP Modules Configuration: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const sortedModules = [...formData.modules].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="min-h-screen pb-12">
      {/* Page Header */}
      <PageHeader
        title="Website Configuration → ERP Modules"
        subtitle="Manage the Comprehensive ERP Modules section titles, menu layout type, visibility, and dynamic module cards."
        icon={HiCube}
        stats={[
          {
            label: "Total Modules",
            value: `${formData.modules.length} Items`,
            description: "Total configured modules"
          },
          {
            label: "Active Modules",
            value: `${formData.modules.filter((m) => m.status === "Active").length} Active`,
            description: "Visible on website"
          },
          {
            label: "Section Status",
            value: formData.enableSection ? "Enabled" : "Disabled",
            description: formData.enableSection ? "Visible on site" : "Hidden from site"
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
                <p className="font-semibold text-sm">ERP Modules configuration saved successfully!</p>
                <p className="text-xs opacity-80">Your live website ERP modules section is updated.</p>
              </div>
            </div>
            <button
              onClick={() => setSavedSuccess(false)}
              className="text-xs font-semibold px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg transition"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Left Form Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General ERP Modules Configuration Card */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <HiSparkles className="text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text">ERP Modules Section Configuration</h2>
                    <p className="text-xs text-text/60">Configure Menu Title, Subtitle, Menu Type and Section Visibility</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs text-text/60 hover:text-primary transition font-medium px-3 py-1.5 rounded-lg border border-border/40 hover:bg-primary/5"
                    title="Reset to default settings"
                  >
                    <FiRotateCcw className="text-xs" /> Reset Defaults
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                {/* Menu Title */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5">
                      <FiTag className="text-primary text-sm" /> Menu Title
                    </label>
                  </div>
                  <input
                    type="text"
                    name="menuTitle"
                    value={formData.menuTitle}
                    onChange={handleChange}
                    placeholder="e.g. Comprehensive ERP Modules"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5">
                      <FiType className="text-primary text-sm" /> Subtitle
                    </label>
                  </div>
                  <input
                    type="text"
                    name="subTitle"
                    value={formData.subTitle || ""}
                    onChange={handleChange}
                    placeholder="e.g. Everything you need to run your business efficiently"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>

                {/* Menu Type Selector */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5 mb-2">
                    <FiGrid className="text-primary text-sm" /> Menu Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, menuType: "Grid" }))}
                      className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition ${formData.menuType === "Grid"
                        ? "bg-primary text-white border-primary shadow-md"
                        : "bg-bg/50 border-border/60 text-text/70 hover:border-primary/40"
                        }`}
                    >
                      <FiGrid className="text-base" /> Grid Layout
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, menuType: "Dropdown" }))}
                      className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition ${formData.menuType === "Dropdown"
                        ? "bg-primary text-white border-primary shadow-md"
                        : "bg-bg/50 border-border/60 text-text/70 hover:border-primary/40"
                        }`}
                    >
                      <FiList className="text-base" /> Dropdown Layout
                    </button>
                  </div>
                </div>

                {/* Enable Section Switch */}
                <div className="pt-2">
                  <div
                    onClick={handleToggleEnable}
                    className={`cursor-pointer border rounded-2xl p-4 md:p-5 flex items-center justify-between transition-all duration-300 ${formData.enableSection
                      ? "bg-primary/5 border-primary/40 shadow-sm"
                      : "bg-bg/40 border-border/60 opacity-80"
                      }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.enableSection ? "bg-primary text-white" : "bg-border/40 text-text/50"
                          }`}
                      >
                        <FiShield className="text-lg" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-text">Enable ERP Modules Section</h4>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${formData.enableSection
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                              }`}
                          >
                            {formData.enableSection ? "Active" : "Disabled"}
                          </span>
                        </div>
                        <p className="text-xs text-text/60 mt-0.5">
                          Toggle whether the ERP Modules section is displayed on the website.
                        </p>
                      </div>
                    </div>

                    <div
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${formData.enableSection ? "bg-primary" : "bg-border"
                        }`}
                    >
                      <div
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${formData.enableSection ? "translate-x-6" : "translate-x-0"
                          }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Modules List Card */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <FiLayers className="text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text">Dynamic Modules List</h2>
                    <p className="text-xs text-text/60">Add, edit, reorder, or delete ERP modules</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md transition active:scale-95"
                >
                  <FiPlus className="text-sm" /> Add Module
                </button>
              </div>

              {/* Modules List */}
              <div className="space-y-3">
                {sortedModules.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border/60 rounded-2xl">
                    <p className="text-xs text-text/50">No ERP modules added yet. Click "+ Add Module" above to add one.</p>
                  </div>
                ) : (
                  sortedModules.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between p-4 bg-bg/50 border border-border/60 rounded-xl hover:border-primary/40 transition group"
                    >
                      <div className="flex items-center gap-3.5">
                        {(item.icon || item.logo) && (typeof (item.icon || item.logo) === "string") && ((item.icon || item.logo).startsWith("data:") || (item.icon || item.logo).startsWith("http") || (item.icon || item.logo).startsWith("/")) ? (
                          <img
                            src={item.icon || item.logo}
                            alt={item.title}
                            className="w-8 h-8 rounded-lg object-contain bg-white/10 p-1 border border-border/50 shrink-0"
                          />
                        ) : (
                          <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                            {item.order || idx + 1}
                          </span>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-text">{item.title}</h4>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                                }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          {item.desc && <p className="text-xs text-text/60 mt-0.5 max-w-md line-clamp-1">{item.desc}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2 text-text/60 hover:text-primary hover:bg-primary/10 rounded-lg transition"
                          title="Edit Module"
                        >
                          <FiEdit2 className="text-sm" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(item.id)}
                          className="p-2 text-text/60 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                          title="Delete Module"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Save Configuration Button */}
              <div className="pt-6 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white px-8 py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving Configuration...
                    </>
                  ) : (
                    <>
                      <FiSave className="text-base" /> Save Configuration
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Preview Card (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <div className="bg-card border border-border/60 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <FiEye className="text-primary text-lg" />
                <h3 className="text-base font-bold text-text">Website Section Preview</h3>
              </div>

              {/* Viewport Switcher */}
              <div className="flex items-center bg-bg/80 border border-border/50 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${previewMode === "desktop" ? "bg-primary text-white shadow-sm" : "text-text/60 hover:text-text"
                    }`}
                  title="Desktop View"
                >
                  <FiMonitor className="text-xs" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${previewMode === "mobile" ? "bg-primary text-white shadow-sm" : "text-text/60 hover:text-text"
                    }`}
                  title="Mobile View"
                >
                  <FiSmartphone className="text-xs" /> Mobile
                </button>
              </div>
            </div>

            {/* Viewport Box */}
            <div
              className={`mx-auto transition-all duration-300 overflow-hidden ${previewMode === "mobile"
                ? "max-w-[320px] rounded-3xl border-4 border-text/20 shadow-2xl"
                : "w-full rounded-2xl border border-border/60"
                }`}
            >
              {/* Browser Bar */}
              <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                  solarkits.com/erp-system
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${formData.enableSection ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`}
                />
              </div>

              {/* Mock Live Website Section Canvas */}
              <div className="bg-slate-50 text-gray-800 p-5 min-h-[380px] flex flex-col justify-start">
                {formData.enableSection ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="text-base font-extrabold text-gray-900">
                        {formData.menuTitle || "Comprehensive ERP Modules"}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {formData.subTitle || "Everything you need to run your business efficiently"}
                      </p>
                    </div>

                    <div className={`grid gap-2.5 ${previewMode === "mobile" ? "grid-cols-1" : "grid-cols-2"}`}>
                      {sortedModules
                        .filter((m) => m.status === "Active")
                        .map((mod) => (
                          <div
                            key={mod.id}
                            className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs hover:shadow-md transition"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                                {(mod.icon || mod.logo) && typeof (mod.icon || mod.logo) === "string" && ((mod.icon || mod.logo).startsWith("data:") || (mod.icon || mod.logo).startsWith("http") || (mod.icon || mod.logo).startsWith("/")) ? (
                                  <img src={mod.icon || mod.logo} alt={mod.title} className="w-4 h-4 object-contain" />
                                ) : (
                                  mod.title.charAt(0)
                                )}
                              </div>
                              <h5 className="text-xs font-bold text-gray-800 line-clamp-1">{mod.title}</h5>
                            </div>
                            {mod.desc && (
                              <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-tight">
                                {mod.desc}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-12 text-center py-10">
                    <FiXCircle className="text-3xl text-rose-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-rose-500">ERP Modules Section Disabled</p>
                    <p className="text-[11px] text-gray-400 mt-1">This section is currently hidden from live website visitors</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/70 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-4">
                <h3 className="text-base font-bold text-text">
                  {editingModule ? "Edit ERP Module" : "+ Add New ERP Module"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-text/60 hover:text-text hover:bg-bg transition"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="space-y-4">
                {/* Module Title */}
                <div>
                  <label className="text-xs font-semibold text-text/80 mb-1 block">Title *</label>
                  <input
                    type="text"
                    required
                    value={modalForm.title}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Finance & Accounting"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-3.5 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-text/80 mb-1 block">Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={modalForm.desc}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, desc: e.target.value }))}
                    placeholder="Brief description of this ERP module..."
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
                  />
                </div>

                {/* Icon Upload / Key */}
                <div>
                  <label className="text-xs font-semibold text-text/80 mb-1 block">Icon Upload / Icon Key</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={modalForm.icon}
                        onChange={(e) => setModalForm((prev) => ({ ...prev, icon: e.target.value }))}
                        placeholder="e.g. Wallet, Boxes, Users, or Image URL"
                        className="flex-1 bg-bg/50 border border-border/70 rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                      />
                      <label className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition shrink-0">
                        <FiUploadCloud className="text-sm" /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setModalForm((prev) => ({ ...prev, icon: reader.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    {modalForm.icon && modalForm.icon.startsWith("data:") && (
                      <div className="flex items-center gap-2 p-2 bg-bg/80 border border-border/40 rounded-lg">
                        <img src={modalForm.icon} alt="Icon Preview" className="w-6 h-6 object-contain" />
                        <span className="text-[10px] text-text/60">Uploaded image preview</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Display Order & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-text/80 mb-1 block">Display Order</label>
                    <input
                      type="number"
                      min={1}
                      value={modalForm.order}
                      onChange={(e) => setModalForm((prev) => ({ ...prev, order: e.target.value }))}
                      placeholder="1"
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-3.5 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text/80 mb-1 block">Status</label>
                    <select
                      value={modalForm.status}
                      onChange={(e) => setModalForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-3.5 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-text/70 hover:bg-bg rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md transition"
                  >
                    {editingModule ? "Update Module" : "Add Module"}
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
