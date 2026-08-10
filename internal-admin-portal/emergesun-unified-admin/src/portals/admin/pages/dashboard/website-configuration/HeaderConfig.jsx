import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
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
  FiTag,
  FiAlignLeft,
  FiInfo,
  FiArrowRight,
  FiShield,
  FiCheck,
  FiImage,
  FiUploadCloud,
  FiLink,
  FiTrash2,
  FiPlus,
  FiEdit2,
  FiChevronDown,
  FiLayers,
  FiX
} from "react-icons/fi";
import { MdExpandMore, MdManageAccounts } from "react-icons/md";
import { HiOutlineTemplate, HiSparkles, HiCube } from "react-icons/hi";

const INITIAL_ERP_MODULES = [
  { id: "erp-1", title: "Finance & Accounting", description: "General ledger, accounts payable/receivable, budgeting, and financial reporting", desc: "General ledger, accounts payable/receivable, budgeting, and financial reporting", status: "Active" },
  { id: "erp-2", title: "Inventory Management", description: "Stock control, warehouse management, batch tracking, and reorder management", desc: "Stock control, warehouse management, batch tracking, and reorder management", status: "Active" },
  { id: "erp-3", title: "HR Management", description: "Employee records, attendance, leave management, and performance tracking", desc: "Employee records, attendance, leave management, and performance tracking", status: "Active" },
  { id: "erp-4", title: "Payroll", description: "Salary processing, tax calculations, deductions, and payslip generation", desc: "Salary processing, tax calculations, deductions, and payslip generation", status: "Active" },
  { id: "erp-5", title: "Procurement", description: "Purchase orders, vendor management, RFQs, and contract management", desc: "Purchase orders, vendor management, RFQs, and contract management", status: "Active" },
  { id: "erp-6", title: "Production Planning", description: "Manufacturing planning, BOM, work orders, and quality control", desc: "Manufacturing planning, BOM, work orders, and quality control", status: "Active" },
  { id: "erp-7", title: "Sales & CRM", description: "Lead management, quotations, sales orders, and customer relationship", desc: "Lead management, quotations, sales orders, and customer relationship", status: "Active" },
  { id: "erp-8", title: "Business Intelligence", description: "Advanced analytics, dashboards, reports, and predictive insights", desc: "Advanced analytics, dashboards, reports, and predictive insights", status: "Active" },
  { id: "erp-9", title: "Project Management", description: "Project planning, resource allocation, task tracking, and time sheets", desc: "Project planning, resource allocation, task tracking, and time sheets", status: "Active" },
  { id: "erp-10", title: "Supply Chain", description: "Logistics, shipment tracking, fleet management, and route optimization", desc: "Logistics, shipment tracking, fleet management, and route optimization", status: "Active" },
  { id: "erp-11", title: "Customer Support", description: "Ticket system, service requests, warranty management, and feedback", desc: "Ticket system, service requests, warranty management, and feedback", status: "Active" },
  { id: "erp-12", title: "Compliance & Security", description: "Regulatory compliance, audit trails, document management, and security", desc: "Regulatory compliance, audit trails, document management, and security", status: "Active" }
];

const PREDEFINED_DROPDOWN_LABELS = [
  "ERP Modules",
  "ERP Solutions",
  "Business ERP Modules",
  "ERP System Modules",
  "Solar ERP Modules"
];

const DEFAULT_CONFIG = {
  badge: "Welcome to SolarKits",
  title: "Powering Tomorrow with Clean Solar Energy",
  subtitle: "High-performance solar systems & custom kit solutions",
  description:
    "Explore our full line of residential and commercial solar packages designed for maximum efficiency, seamless setup, and long-term durability.",
  imageUrl: "",
  status: true,
  erpModulesTitle: "ERP Modules",
  erpModulesSubTitle: "Everything you need to run your business efficiently",
  erpModulesStatus: true,
  erpModules: INITIAL_ERP_MODULES
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function HeaderConfig() {
  const location = useLocation();
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewDropdownOpen, setPreviewDropdownOpen] = useState(false);

  // Accordion open state for ERP Modules Header Dropdown card
  const [erpAccordionOpen, setErpAccordionOpen] = useState(true);
  const [heroAccordionOpen, setHeroAccordionOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.includes("hero-banner")) {
      setHeroAccordionOpen(true);
      setErpAccordionOpen(false);
    } else if (location.pathname.includes("erp-modules")) {
      setErpAccordionOpen(true);
      setHeroAccordionOpen(false);
    }
  }, [location.pathname]);

  // Top header dropdown selector state
  const [topNavDropdownOpen, setTopNavDropdownOpen] = useState(false);
  const topNavRef = useRef(null);

  // Label Selector Dropdown state inside form
  const [labelSelectOpen, setLabelSelectOpen] = useState(false);
  const labelSelectRef = useRef(null);

  // Modal for Adding/Editing ERP Module Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [modalForm, setModalForm] = useState({ title: "", description: "", logo: "", icon: "", status: "Active" });

  useEffect(() => {
    fetchHeader();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (topNavRef.current && typeof topNavRef.current.contains === "function" && !topNavRef.current.contains(event.target)) {
        setTopNavDropdownOpen(false);
      }
      if (labelSelectRef.current && typeof labelSelectRef.current.contains === "function" && !labelSelectRef.current.contains(event.target)) {
        setLabelSelectOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchHeader = async () => {
    try {
      // API Call: GET /api/website/v1/get - Fetch Header configuration
      const response = await axios.get(
        `${BASE_URL}/api/website/v1/get?t=${Date.now()}`
      );

      if (response.data?.data) {
        const dbModules = response.data.data.erpModules;
        setFormData((prev) => ({
          ...prev,
          ...response.data.data,
          erpModules: (Array.isArray(dbModules) && dbModules.length > 0)
            ? dbModules
            : INITIAL_ERP_MODULES
        }));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const processImageFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        imageUrl: reader.result,
      }));
      setSavedSuccess(false);
    };
    reader.readAsDataURL(file);
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

  const handleToggleErpStatus = () => {
    setFormData((prev) => ({ ...prev, erpModulesStatus: !prev.erpModulesStatus }));
    setSavedSuccess(false);
  };

  const handleReset = () => {
    setFormData(DEFAULT_CONFIG);
    setSavedSuccess(false);
  };

  // Module Modal Actions
  const handleOpenAddModal = () => {
    setEditingModule(null);
    setModalForm({ title: "", description: "", logo: "", icon: "", status: "Active" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mod) => {
    setEditingModule(mod);
    setModalForm({
      title: mod.title || "",
      description: mod.description || mod.desc || "",
      logo: mod.logo || mod.icon || "",
      icon: mod.icon || mod.logo || "",
      status: mod.status || "Active"
    });
    setIsModalOpen(true);
  };

  const handleDeleteModule = (id) => {
    if (confirm("Are you sure you want to remove this ERP module from header dropdown?")) {
      setFormData((prev) => ({
        ...prev,
        erpModules: (prev.erpModules || []).filter((m) => m.id !== id)
      }));
      setSavedSuccess(false);
    }
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!modalForm.title.trim()) return;

    const itemLogo = modalForm.logo || modalForm.icon || "";

    if (editingModule) {
      setFormData((prev) => ({
        ...prev,
        erpModules: (prev.erpModules || []).map((m) =>
          m.id === editingModule.id
            ? {
                ...m,
                title: modalForm.title,
                description: modalForm.description,
                desc: modalForm.description,
                logo: itemLogo,
                icon: itemLogo,
                status: modalForm.status
              }
            : m
        )
      }));
    } else {
      const newMod = {
        id: `erp-${Date.now()}`,
        title: modalForm.title,
        description: modalForm.description,
        desc: modalForm.description,
        logo: itemLogo,
        icon: itemLogo,
        status: modalForm.status
      };
      setFormData((prev) => ({
        ...prev,
        erpModules: [...(prev.erpModules || []), newMod]
      }));
    }

    setIsModalOpen(false);
    setSavedSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      let response;
      if (formData._id && formData._id.length === 24) {
        // API Call: PATCH /api/website/v1/update/:id - Update Header configuration
        response = await axios.patch(
          `${BASE_URL}/api/website/v1/update/${formData._id}`,
          formData
        );
      } else {
        // API Call: POST /api/website/v1/create - Create Header configuration
        response = await axios.post(
          `${BASE_URL}/api/website/v1/create`,
          formData
        );
      }

      // Also sync and save to ERP Modules API
      try {
        // API Call: POST /api/website/v1/erp-modules/save - Sync ERP Modules configuration
        await axios.post(`${BASE_URL}/api/website/v1/erp-modules/save`, {
          menuTitle: formData.erpModulesTitle || "Comprehensive ERP Modules",
          subTitle: formData.erpModulesSubTitle || formData.subTitle || "Everything you need to run your business efficiently",
          enableSection: formData.erpModulesStatus !== false,
          modules: (formData.erpModules || []).map((mod, idx) => ({
            id: mod.id || `erp-${idx + 1}`,
            order: idx + 1,
            title: mod.title,
            desc: mod.description || mod.desc || "",
            description: mod.description || mod.desc || "",
            icon: mod.logo || mod.icon || "",
            logo: mod.logo || mod.icon || "",
            status: mod.status || "Active"
          }))
        });
      } catch (erpSaveErr) {
        console.warn("ERP Modules sync error:", erpSaveErr.message);
      }

      console.log(response.data);
      if (response.data?.data) {
        setFormData((prev) => ({
          ...prev,
          ...response.data.data
        }));
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (error) {
      console.error("Failed to save header configuration:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Page Header */}
      <PageHeader
        title="Header Configuration"
        subtitle="Configure website header hero banner and ERP Modules dropdown navigation menu in real time."
        icon={HiOutlineTemplate}
        stats={[
          {
            label: "Header Status",
            value: formData.status ? "Active" : "Disabled",
            description: formData.status ? "Visible on live site" : "Hidden from site",
          },
          {
            label: "ERP Modules Dropdown",
            value: formData.erpModulesStatus ? "Enabled" : "Disabled",
            description: `${(formData.erpModules || []).length} Dropdown Items`,
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
                <p className="font-semibold text-sm">Header configuration saved successfully!</p>
                <p className="text-xs opacity-80">Your website header content & ERP Modules dropdown are ready for live publishing.</p>
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
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Hero Banner Configuration Card */}
            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xl backdrop-blur-md relative overflow-hidden">
              <button
                type="button"
                onClick={() => setHeroAccordionOpen(!heroAccordionOpen)}
                className="w-full bg-bg/50 hover:bg-bg/80 border border-border/80 rounded-2xl px-6 py-4 flex items-center justify-between text-text font-bold transition-all shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500">
                    <HiSparkles className="text-xl" />
                  </div>
                  <span className="text-lg font-bold text-text tracking-wide">
                    Hero Banner Content
                  </span>
                </div>
                <MdExpandMore
                  className={`text-2xl text-amber-500 transition-transform duration-300 ${heroAccordionOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {heroAccordionOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-5 border-t border-border/60 space-y-5"
                  >
                    {/* Header Status Toggle */}
                    <div className="flex items-center justify-between p-3.5 bg-bg/50 rounded-xl border border-border/80">
                      <div>
                        <span className="text-xs font-bold text-text block">Hero Banner Status</span>
                        <span className="text-[11px] text-text/60">Show or hide the hero section on website header</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleStatus}
                        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer select-none ${formData.status ? "bg-primary border-primary" : "bg-bg/60 border-border/60"}`}
                      >
                        <span className={`relative inline-block w-8 h-4 rounded-full transition-colors duration-300 ${formData.status ? "bg-white/30" : "bg-border/60"}`}>
                          <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${formData.status ? "translate-x-4" : "translate-x-0"}`} />
                        </span>
                        <span className={`text-xs font-bold transition-colors duration-300 ${formData.status ? "text-white" : "text-text/50"}`}>
                          {formData.status ? "Enabled" : "Disabled"}
                        </span>
                      </button>
                    </div>

                    {/* Badge */}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5 mb-2">
                        <FiTag className="text-amber-550 text-sm" /> Top Badge Text
                      </label>
                      <input
                        type="text"
                        name="badge"
                        value={formData.badge || ""}
                        onChange={handleChange}
                        placeholder="e.g. Welcome to SolarKits"
                        className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5 mb-2">
                        <FiType className="text-amber-555 text-sm" /> Main Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        required
                        value={formData.title || ""}
                        onChange={handleChange}
                        placeholder="e.g. Powering Tomorrow with Clean Solar Energy"
                        className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition font-bold"
                      />
                    </div>

                    {/* Subtitle */}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5 mb-2">
                        <FiType className="text-amber-550 text-sm" /> Subtitle / Tagline
                      </label>
                      <input
                        type="text"
                        name="subtitle"
                        value={formData.subtitle || ""}
                        onChange={handleChange}
                        placeholder="e.g. High-performance solar systems..."
                        className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5 mb-2">
                        <FiAlignLeft className="text-amber-550 text-sm" /> Banner Description
                      </label>
                      <textarea
                        name="description"
                        rows={3}
                        value={formData.description || ""}
                        onChange={handleChange}
                        placeholder="Explore our full line of residential and commercial solar packages..."
                        className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-xs text-text focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition resize-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Header ERP Modules Dropdown Accordion Button (Matching Screenshot UI) */}
            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xl backdrop-blur-md relative overflow-hidden">
              <button
                type="button"
                onClick={() => setErpAccordionOpen(!erpAccordionOpen)}
                className="w-full bg-bg/50 hover:bg-bg/80 border border-border/80 rounded-2xl px-6 py-4 flex items-center justify-between text-text font-bold transition-all shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-500">
                    <HiCube className="text-xl" />
                  </div>
                  <span className="text-lg font-bold text-text tracking-wide">
                    {formData.erpModulesTitle || "ERP Modules"}
                  </span>
                </div>
                <MdExpandMore
                  className={`text-2xl text-blue-500 transition-transform duration-300 ${erpAccordionOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {/* Accordion Content */}
              <AnimatePresence>
                {erpAccordionOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-5 border-t border-border/60 space-y-6"
                  >
                    {/* ERP Modules Dropdown Status Toggle */}
                    <div className="flex items-center justify-between p-3.5 bg-bg/50 rounded-xl border border-border/80">
                      <div>
                        <span className="text-xs font-bold text-text block">ERP Dropdown Menu Status</span>
                        <span className="text-[11px] text-text/60">Show or hide the ERP modules dropdown under Header</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleErpStatus}
                        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer select-none ${formData.erpModulesStatus ? "bg-primary border-primary" : "bg-bg/60 border-border/60"}`}
                      >
                        <span className={`relative inline-block w-8 h-4 rounded-full transition-colors duration-300 ${formData.erpModulesStatus ? "bg-white/30" : "bg-border/60"}`}>
                          <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${formData.erpModulesStatus ? "translate-x-4" : "translate-x-0"}`} />
                        </span>
                        <span className={`text-xs font-bold transition-colors duration-300 ${formData.erpModulesStatus ? "text-white" : "text-text/50"}`}>
                          {formData.erpModulesStatus ? "Enabled" : "Disabled"}
                        </span>
                      </button>
                    </div>
                    {/* Dropdown Menu Label Input */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5">
                          <FiTag className="text-blue-500 text-sm" /> Dropdown Menu Label
                        </label>
                        <span className="text-[11px] text-text/60">{formData.erpModulesTitle ? formData.erpModulesTitle.length : 0} / 30</span>
                      </div>

                      {/* Interactive Select Dropdown Box with Chevron Down icon */}
                      <div className="relative" ref={labelSelectRef}>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            name="erpModulesTitle"
                            value={formData.erpModulesTitle || "ERP Modules"}
                            onChange={handleChange}
                            maxLength={30}
                            placeholder="e.g. ERP Modules"
                            className="w-full bg-bg/50 border border-border/70 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-text focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setLabelSelectOpen(!labelSelectOpen)}
                            className="absolute right-0 inset-y-0 px-3.5 flex items-center justify-center text-text/60 hover:text-blue-500 transition"
                            title="Select Predefined Label"
                          >
                            <MdExpandMore className={`text-xl transition-transform duration-300 ${labelSelectOpen ? "rotate-180 text-blue-500" : ""}`} />
                          </button>
                        </div>

                        {/* Predefined Dropdown Popup */}
                        <AnimatePresence>
                          {labelSelectOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute left-0 right-0 mt-1.5 bg-card border border-border rounded-xl p-1.5 shadow-2xl z-40"
                            >
                              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-text/60 tracking-wider">
                                Select Predefined Label
                              </div>
                              {PREDEFINED_DROPDOWN_LABELS.map((lbl) => (
                                <button
                                  key={lbl}
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, erpModulesTitle: lbl }));
                                    setLabelSelectOpen(false);
                                    setSavedSuccess(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition flex items-center justify-between ${formData.erpModulesTitle === lbl
                                      ? "bg-blue-650 text-text-inverse"
                                      : "text-text/80 hover:bg-bg/80"
                                    }`}
                                >
                                  <span>{lbl}</span>
                                  {formData.erpModulesTitle === lbl && <FiCheck className="text-xs" />}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Section Subtitle / Tagline Input */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5">
                          <FiType className="text-blue-500 text-sm" /> Section Subtitle / Tagline
                        </label>
                        <span className="text-[11px] text-text/60">{(formData.erpModulesSubTitle || formData.subTitle || "").length} / 100</span>
                      </div>
                      <input
                        type="text"
                        name="erpModulesSubTitle"
                        value={formData.erpModulesSubTitle ?? formData.subTitle ?? "Everything you need to run your business efficiently"}
                        onChange={handleChange}
                        maxLength={100}
                        placeholder="e.g. Everything you need to run your business efficiently"
                        className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
                      />
                    </div>

                    {/* Module Items List */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-semibold uppercase tracking-wider text-text/80">
                          Configured Dropdown Items ({(formData.erpModules || []).length})
                        </label>
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md transition active:scale-95"
                        >
                          <FiPlus className="text-xs" /> Add Item
                        </button>
                      </div>

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {(formData.erpModules || []).map((item, idx) => (
                           <div
                            key={item.id || idx}
                            className="flex items-center justify-between p-3 bg-bg/50 border border-border/70 rounded-xl hover:border-blue-500/40 transition group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {(item.logo || item.icon) ? (
                                <img
                                  src={item.logo || item.icon}
                                  alt={item.title}
                                  className="w-7 h-7 rounded-lg object-contain bg-white/10 p-1 border border-border/70 shrink-0"
                                />
                              ) : (
                                <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-500 text-xs font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                              )}
                              <div className="min-w-0">
                                <span className="text-sm font-bold text-text block truncate">{item.title}</span>
                                {(item.description || item.desc) && (
                                  <span className="text-xs text-text/60 block truncate max-w-[240px]">
                                    {item.description || item.desc}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 text-text/60 hover:text-blue-550 rounded-lg hover:bg-blue-500/10 transition"
                                title="Edit Item"
                              >
                                <FiEdit2 className="text-xs" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteModule(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                                title="Delete Item"
                              >
                                <FiTrash2 className="text-xs" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <FiSave className="text-base" /> Save Header Configuration
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Preview Card (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <div className="bg-card border border-border/60 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
            {/* Header Controls */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <FiEye className="text-primary text-lg" />
                <h3 className="text-base font-bold text-text">Live Header Preview</h3>
              </div>

              {/* Desktop / Mobile Switcher */}
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

            {/* Mock Viewport Container */}
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
                <span className="text-[10px] text-slate-400 font-mono tracking-tight truncate max-w-[180px]">
                  emergesun.com
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${formData.status ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`}
                />
              </div>

              {/* Website Navbar Mock Preview */}
              <div className="bg-white border-b border-gray-200 px-3 py-2.5 flex items-center justify-between shadow-2xs">
                <span className="text-xs font-black text-blue-600">EmergeSun</span>

                {/* Navbar Links */}
                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-700">
                  <span className="text-gray-500 hover:text-blue-600 cursor-pointer">ERP</span>

                  {/* ERP Modules Dropdown Button matching screenshot design */}
                  {formData.erpModulesStatus && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setPreviewDropdownOpen(!previewDropdownOpen)}
                        className="flex items-center gap-1 text-blue-600 font-extrabold hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                      >
                        <span>{formData.erpModulesTitle || "ERP Modules"}</span>
                        <MdExpandMore className={`text-sm transition-transform duration-300 ${previewDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {previewDropdownOpen && (
                        <div className="absolute left-0 mt-1 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 z-30 max-h-48 overflow-y-auto space-y-0.5">
                          {(formData.erpModules || []).map((mod, i) => (
                            <div
                              key={i}
                              className="px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg cursor-pointer flex items-center gap-2"
                            >
                              {(mod.logo || mod.icon) ? (
                                <img src={mod.logo || mod.icon} alt="" className="w-4 h-4 object-contain shrink-0 rounded-xs" />
                              ) : (
                                <span className="w-4 h-4 rounded-xs bg-blue-100 text-blue-600 text-[9px] font-bold flex items-center justify-center shrink-0">
                                  {i + 1}
                                </span>
                              )}
                              <span className="truncate">{mod.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <span className="text-gray-500 hidden sm:inline">Software ▼</span>
                </div>
              </div>

              {/* Live Mock Hero Canvas */}
              <div
                className={`relative bg-slate-950 text-white p-6 overflow-hidden min-h-[300px] flex flex-col justify-center transition-opacity ${!formData.status ? "opacity-40 grayscale" : ""
                  }`}
              >
                <div className="relative z-10 space-y-3">
                  {formData.badge && (
                    <div className="inline-flex items-center gap-1 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] px-2.5 py-0.5 rounded-full font-medium">
                      <HiSparkles className="text-amber-400 text-xs" />
                      <span>{formData.badge}</span>
                    </div>
                  )}
                  <h1 className="text-xl font-extrabold text-white tracking-tight leading-tight">
                    {formData.title || "Header Title..."}
                  </h1>
                  {formData.subtitle && (
                    <p className="text-xs font-semibold text-blue-400">
                      {formData.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {!formData.status && (
                <div className="bg-rose-500/10 border-t border-rose-500/30 p-2 text-center">
                  <span className="text-[11px] font-semibold text-rose-400 flex items-center justify-center gap-1">
                    <FiXCircle /> Hero Banner Hidden
                  </span>
                </div>
              )}
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
                  {editingModule ? "Edit Dropdown Item" : "Add Dropdown Item"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-text/60 hover:text-text hover:bg-bg transition"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text/80 mb-1 block">Item Title</label>
                  <input
                    type="text"
                    required
                    value={modalForm.title}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Finance & Accounting"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-3.5 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text/80 mb-1 block">Description</label>
                  <textarea
                    rows={3}
                    value={modalForm.description || ""}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter module description..."
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition resize-none"
                  />
                </div>

                {/* Item Logo / Icon Field */}
                <div>
                  <label className="text-xs font-semibold text-text/80 mb-1 block">Item Logo / Icon</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={modalForm.logo || modalForm.icon || ""}
                        onChange={(e) => setModalForm((prev) => ({ ...prev, logo: e.target.value, icon: e.target.value }))}
                        placeholder="Upload logo image or paste Image URL..."
                        className="flex-1 bg-bg/50 border border-border/70 rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
                      />
                      <label className="cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 border border-blue-500/30">
                        <FiUploadCloud className="text-sm" /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                alert("Logo file size must be under 2MB.");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setModalForm((prev) => ({ ...prev, logo: reader.result, icon: reader.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {(modalForm.logo || modalForm.icon) && (
                      <div className="flex items-center justify-between p-2 bg-bg/80 border border-border/50 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={modalForm.logo || modalForm.icon}
                            alt="Logo Preview"
                            className="w-8 h-8 rounded-lg object-contain bg-white/10 p-1 border border-border/40"
                          />
                          <span className="text-[11px] text-text/70 font-medium">Selected Logo Preview</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setModalForm((prev) => ({ ...prev, logo: "", icon: "" }))}
                          className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 hover:bg-rose-500/10 rounded-lg transition"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text/80 mb-1 block">Status</label>
                  <select
                    value={modalForm.status || "Active"}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-3.5 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
                  >
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-text/70 hover:bg-bg rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition"
                  >
                    {editingModule ? "Update Item" : "Add Item"}
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

export default HeaderConfig;