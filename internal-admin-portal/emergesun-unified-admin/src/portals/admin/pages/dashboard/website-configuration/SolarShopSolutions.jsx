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
  FiLayers,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiGrid,
  FiX,
  FiInfo,
  FiList
} from "react-icons/fi";
import { Layers, Smartphone, BarChart3, Sparkles } from "lucide-react";

const ICON_MAP = {
  Layers,
  Smartphone,
  BarChart3,
  Sparkles
};

const DEFAULT_CONFIG = {
  solutionsTag: "Our Software Solutions",
  solutionsTitle: "Digital Solutions for Modern Solar Business",
  solutionsSubtitle: "Comprehensive software suite to manage every aspect of your solar business",
  solutionsList: [
    {
      title: "Solar Installer Marketplace",
      description: "Connect with top solar installers, compare quotes, and manage installations seamlessly.",
      icon: "Layers",
      color: "from-blue-500/20 to-blue-600/20 text-blue-600",
      path: "/solar-installer",
      enabled: true
    },
    {
      title: "Solar Dealer App",
      description: "Powerful mobile app for solar dealers to manage inventory, orders, and customer relationships.",
      icon: "Smartphone",
      color: "from-green-500/20 to-green-600/20 text-green-600",
      path: "/solar-dealer",
      enabled: true
    },
    {
      title: "Solar Mega Watt Project Management",
      description: "Advanced project management tools for large-scale solar installations.",
      icon: "BarChart3",
      color: "from-purple-500/20 to-purple-600/20 text-purple-600",
      path: "/megawatt-project",
      enabled: true
    },
    {
      title: "Solar AMC Management",
      description: "Complete annual maintenance contract management for solar assets.",
      icon: "Sparkles",
      color: "from-red-500/20 to-red-600/20 text-red-600",
      path: "/solar-amc",
      enabled: true
    }
  ],
  enableSection: true,
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function SolarShopSolutions() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit / Add Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null); // null when adding, index when editing
  const [modalForm, setModalForm] = useState({
    title: "",
    description: "",
    icon: "Layers",
    color: "from-blue-500/20 to-blue-600/20 text-blue-600",
    path: "",
    enabled: true
  });

  useEffect(() => {
    fetchSolarShopSolutions();
  }, []);

  const fetchSolarShopSolutions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/website/v1/solar-shop/get?t=${Date.now()}`
      );
      if (response.data?.data) {
        const data = response.data.data;
        setFormData((prev) => {
          const merged = { ...prev };
          for (const key in data) {
            if (key === "solutionsList") continue;
            if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
              merged[key] = data[key];
            }
          }
          if (Array.isArray(data.solutionsList) && data.solutionsList.length > 0) {
            merged.solutionsList = data.solutionsList.map(item => ({
              ...item,
              enabled: item.enabled !== undefined ? item.enabled : true
            }));
          }
          return merged;
        });
      }
    } catch (error) {
      console.log("Using default configuration or API endpoint pending:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSavedSuccess(false);
  };

  const handleOpenAddModal = () => {
    setEditingCard(null);
    setModalForm({
      title: "",
      description: "",
      icon: "Layers",
      color: "from-blue-500/20 to-blue-600/20 text-blue-600",
      path: "",
      enabled: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (card, index) => {
    setEditingCard(index);
    setModalForm({
      title: card.title || "",
      description: card.description || "",
      icon: card.icon || "Layers",
      color: card.color || "from-blue-500/20 to-blue-600/20 text-blue-600",
      path: card.path || "",
      enabled: card.enabled !== undefined ? card.enabled : true
    });
    setIsModalOpen(true);
  };

  const handleSaveModalSolution = (e) => {
    e.preventDefault();
    if (!modalForm.title.trim()) return;

    if (editingCard !== null) {
      // Update existing card
      setFormData((prev) => {
        const updatedList = prev.solutionsList.map((c, idx) =>
          idx === editingCard
            ? {
                ...c,
                title: modalForm.title.trim(),
                description: modalForm.description.trim(),
                icon: modalForm.icon,
                color: modalForm.color,
                path: modalForm.path.trim()
              }
            : c
        );
        return { ...prev, solutionsList: updatedList };
      });
    } else {
      // Add new card
      const newCard = {
        title: modalForm.title.trim(),
        description: modalForm.description.trim(),
        icon: modalForm.icon,
        color: modalForm.color,
        path: modalForm.path.trim(),
        enabled: true
      };
      setFormData((prev) => ({
        ...prev,
        solutionsList: [...prev.solutionsList, newCard]
      }));
    }

    setIsModalOpen(false);
    setSavedSuccess(false);
  };

  const handleDeleteCard = (index) => {
    if (window.confirm("Are you sure you want to delete this card?")) {
      const updatedList = formData.solutionsList.filter((_, idx) => idx !== index);
      setFormData((prev) => ({
        ...prev,
        solutionsList: updatedList
      }));
      setSavedSuccess(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset Solutions fields to default values?")) {
      setFormData({
        ...formData,
        ...DEFAULT_CONFIG,
      });
      setSavedSuccess(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const now = new Date();
      const updatedTimeStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      
      const payload = {
        ...formData,
        lastUpdated: updatedTimeStr
      };

      await axios.patch(
        `${BASE_URL}/api/website/v1/solar-shop/update`,
        payload
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save configuration: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-text/60 font-semibold text-sm">Loading Solutions Configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="Solar Shop - Our Software Solutions"
        description="Configure titles, badge tags, descriptions, redirect URLs, color schemes, and icons for Software Solutions feature cards"
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form panel */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-card border border-border/40 shadow-xl rounded-2xl p-6 space-y-6">
          
          {/* Header configuration fields */}
          <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
            <div className="flex items-center justify-between border-b border-border/25 pb-3 mb-1">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <FiLayers className="text-primary" /> Software Solutions Headers
              </h3>
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
            <div>
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Solutions Tag (Badge)</label>
              <input
                type="text"
                name="solutionsTag"
                value={formData.solutionsTag}
                onChange={handleChange}
                required
                className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                placeholder="e.g., Our Software Solutions"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Solutions Title</label>
              <input
                type="text"
                name="solutionsTitle"
                value={formData.solutionsTitle}
                onChange={handleChange}
                required
                className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Solutions Subtitle</label>
              <textarea
                rows={3}
                name="solutionsSubtitle"
                value={formData.solutionsSubtitle}
                onChange={handleChange}
                required
                className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
              />
            </div>
          </div>

          {/* Solutions List Table (Matches Services layout) */}
          <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-xl bg-bg/20 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/25">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <FiList className="text-xl" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text">Solutions List</h2>
                  <p className="text-xs text-text/60">Configure the interactive software cards</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1 text-xs text-white bg-primary hover:bg-primary/95 transition font-bold px-3.5 py-2 rounded-xl shadow-md cursor-pointer"
              >
                <FiPlus className="text-sm" /> Add Card
              </button>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto rounded-xl border border-border/50 bg-bg/20">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-bg/60 text-text/50 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-12 text-center">Order</th>
                    <th className="py-3 px-4">Card Title</th>
                    <th className="py-3 px-4">URL / Path</th>
                    <th className="py-3 px-4">Icon & Color</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {formData.solutionsList.map((card, idx) => (
                    <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-text/60 font-bold">
                          <FiGrid className="text-xs text-text/30" />
                          <span>{idx + 1}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-text">
                        {card.title || "No Title"}
                      </td>
                      <td className="py-3 px-4 text-text/60 font-mono text-[10px]">
                        {card.path || "/"}
                      </td>
                      <td className="py-3 px-4 text-text/65">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-bg/50 border border-border/40 rounded text-[10px]">
                          {card.icon} ({card.color.includes("blue") ? "Blue" : card.color.includes("green") ? "Green" : card.color.includes("purple") ? "Purple" : "Red"})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              solutionsList: prev.solutionsList.map((item, i) =>
                                i === idx ? { ...item, enabled: item.enabled === false ? true : false } : item
                              )
                            }));
                            setSavedSuccess(false);
                          }}
                          className={`relative inline-flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all duration-300 cursor-pointer select-none ${card.enabled !== false ? "bg-primary border-primary" : "bg-bg/60 border-border/60"}`}
                        >
                          <span className={`relative inline-block w-6 h-3 rounded-full transition-colors duration-300 ${card.enabled !== false ? "bg-white/30" : "bg-border/60"}`}>
                            <span className={`absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white shadow-sm transition-transform duration-300 ${card.enabled !== false ? "translate-x-3" : "translate-x-0"}`} />
                          </span>
                          <span className={`text-[9px] font-bold transition-colors duration-300 ${card.enabled !== false ? "text-white" : "text-text/50"}`}>
                            {card.enabled !== false ? "Enabled" : "Disabled"}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(card, idx)}
                            className="p-1.5 text-primary hover:bg-primary/10 border border-primary/20 rounded-lg transition cursor-pointer"
                            title="Edit Card"
                          >
                            <FiEdit2 className="text-xs" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition cursor-pointer"
                            title="Delete Card"
                          >
                            <FiTrash2 className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {formData.solutionsList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-text/50">
                        No cards found. Click "Add Card" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border/20">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl border border-border/70 text-text/80 hover:bg-bg/40 font-bold text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <FiRotateCcw /> Reset Solutions
            </button>
            
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition flex items-center gap-2 disabled:opacity-55 cursor-pointer"
            >
              <FiSave /> {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Live Mockup Preview Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-xl sticky top-6">
            <div className="flex items-center justify-between border-b border-border/25 pb-4 mb-6">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <FiEye className="text-primary" /> Live Mockup Preview
              </h3>
              <div className="flex items-center bg-bg/50 border border-border/50 rounded-lg p-0.5">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-1.5 rounded-md transition ${
                    previewMode === "desktop" ? "bg-card text-primary shadow" : "text-text/60"
                  }`}
                  title="Desktop View"
                >
                  <FiMonitor className="text-sm" />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-1.5 rounded-md transition ${
                    previewMode === "mobile" ? "bg-card text-primary shadow" : "text-text/60"
                  }`}
                  title="Mobile View"
                >
                  <FiSmartphone className="text-sm" />
                </button>
              </div>
            </div>

            <div className="flex justify-center bg-bg/35 border border-border/30 rounded-xl p-4 overflow-hidden">
              <div
                className={`bg-white text-gray-800 transition-all duration-300 overflow-hidden shadow-inner ${
                  previewMode === "mobile" ? "w-[340px] min-h-[500px]" : "w-full min-h-[380px]"
                }`}
                style={{ fontSize: previewMode === "mobile" ? "10px" : "12px" }}
              >
                <div className="p-6 bg-white text-center">
                  
                  <span className="text-[9px] font-extrabold tracking-wider text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full">
                    {formData.solutionsTag}
                  </span>

                  <h2 className="mt-4 text-base font-extrabold text-gray-800 leading-tight">
                    {formData.solutionsTitle}
                  </h2>

                  <p className="mt-2 text-[10px] text-gray-500 max-w-sm mx-auto">
                    {formData.solutionsSubtitle}
                  </p>

                  <div className={`mt-6 grid gap-4 ${previewMode === "mobile" ? "grid-cols-1" : "grid-cols-2"}`}>
                    {formData.solutionsList.map((sol, i) => {
                      const Icon = ICON_MAP[sol.icon] || Layers;
                      return (
                        <div key={i} className="bg-white border border-gray-150 p-4 rounded-xl text-left shadow-sm">
                          <div className={`inline-flex rounded-xl bg-gradient-to-br ${sol.color || "from-blue-500/20 to-blue-600/20 text-blue-600"} p-2`}>
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <h3 className="mt-2 font-bold text-gray-800 text-xs">{sol.title}</h3>
                          <p className="text-[9px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{sol.description}</p>
                          <span className="mt-2 inline-block text-[9px] font-bold text-orange-500">Learn More &gt;</span>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit / Add Card Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-text/50 hover:text-text p-1.5 rounded-lg hover:bg-bg/60 transition cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>

              <h3 className="text-lg font-extrabold text-text mb-1">
                {editingCard !== null ? "Edit Solutions Card" : "Add Solutions Card"}
              </h3>
              <p className="text-xs text-text/60 mb-5">
                {editingCard !== null ? "Modify the properties of this software features card." : "Create a new software feature card configuration."}
              </p>

              <form onSubmit={handleSaveModalSolution} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">
                    Card Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalForm.title}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Solar Installer Marketplace"
                    required
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>

                {/* Path URL */}
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">
                    Redirect URL / Path <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalForm.path}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, path: e.target.value }))}
                    placeholder="e.g., /solar-installer"
                    required
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">
                    Card Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={modalForm.description}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide a short features detail..."
                    required
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
                  />
                </div>

                {/* Icon Selection & Theme Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text mb-1.5">
                      Card Icon
                    </label>
                    <select
                      value={modalForm.icon}
                      onChange={(e) => setModalForm((prev) => ({ ...prev, icon: e.target.value }))}
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition cursor-pointer"
                    >
                      <option value="Layers">Layers Icon</option>
                      <option value="Smartphone">Smartphone Icon</option>
                      <option value="BarChart3">Bar Chart Icon</option>
                      <option value="Sparkles">Sparkles Icon</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text mb-1.5">
                      Theme Color
                    </label>
                    <select
                      value={modalForm.color}
                      onChange={(e) => setModalForm((prev) => ({ ...prev, color: e.target.value }))}
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition cursor-pointer"
                    >
                      <option value="from-blue-500/20 to-blue-600/20 text-blue-600">Blue Theme</option>
                      <option value="from-green-500/20 to-green-600/20 text-green-600">Green Theme</option>
                      <option value="from-purple-500/20 to-purple-600/20 text-purple-600">Purple Theme</option>
                      <option value="from-red-500/20 to-red-600/20 text-red-600">Red Theme</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-border/60 text-text/70 hover:bg-bg/60 text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-md shadow-primary/20 transition cursor-pointer"
                  >
                    {editingCard !== null ? "Save Card" : "Add Card"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save Success Alert Portal */}
      <AnimatePresence>
        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-55 flex items-center gap-3 bg-green-550 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-white/10"
          >
            <FiCheckCircle className="text-xl" />
            <div>
              <h4 className="font-bold text-sm">Solutions Configurations Saved</h4>
              <p className="text-xs text-white/90">Solar Shop page updated successfully</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
