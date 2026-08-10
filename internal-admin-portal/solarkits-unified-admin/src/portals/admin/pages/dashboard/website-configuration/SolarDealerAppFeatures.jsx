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
import { Boxes, ShoppingCart, Users, BarChart3, CreditCard, Bell, Calendar, Headphones, Tag, ShieldCheck, GitCompare, Star, Lock, Clock, Smile } from "lucide-react";

const ICON_MAP = {
  Boxes,
  ShoppingCart,
  Users,
  BarChart3,
  CreditCard,
  Bell,
  Calendar,
  Headphones,
  Tag,
  ShieldCheck,
  GitCompare,
  Star,
  Lock,
  Clock,
  Smile
};

const COLOR_OPTIONS = [
  { name: "Green", class: "text-green-600 bg-green-50" },
  { name: "Blue", class: "text-blue-600 bg-blue-50" },
  { name: "Orange", class: "text-orange-600 bg-orange-50" },
  { name: "Purple", class: "text-purple-600 bg-purple-50" },
  { name: "Teal", class: "text-teal-600 bg-teal-50" },
  { name: "Red", class: "text-red-600 bg-red-50" },
  { name: "Amber", class: "text-amber-800 bg-amber-50" },
  { name: "Indigo", class: "text-indigo-600 bg-indigo-50" },
  { name: "Pink", class: "text-pink-600 bg-pink-50" }
];

const DEFAULT_CONFIG = {
  featuresTitle: "Powerful Features for Solar Dealers",
  featuresSubtitle: "Everything you need to manage and grow your solar business",
  featuresList: [
    { title: "Dashboard Management", description: "Complete overview of your business with real-time analytics, sales performance, and key metrics at a glance", icon: "Boxes", color: "text-green-600 bg-green-50", enabled: true },
    { title: "Project Signup", description: "Complete project lifecycle management - Lead tracking, Site Survey, Quote Generation, and Project Signup workflow", icon: "ShoppingCart", color: "text-blue-600 bg-blue-50", enabled: true },
    { title: "Project Management", description: "End-to-end Service Management - Installation tracking, Timeline management, Task assignment, and Progress monitoring", icon: "Users", color: "text-orange-600 bg-orange-50", enabled: true },
    { title: "Business Analytics", description: "Real-time insights into sales, revenue, and business performance", icon: "BarChart3", color: "text-purple-600 bg-purple-50", enabled: true },
    { title: "Payment Tracking", description: "Track payments, dues, and generate payment receipts", icon: "CreditCard", color: "text-teal-600 bg-teal-50", enabled: true },
    { title: "Stock Alerts", description: "Get notified when stock reaches reorder level", icon: "Bell", color: "text-red-600 bg-red-50", enabled: true },
    { title: "Installation Scheduling", description: "Schedule and track installations with calendar integration", icon: "Calendar", color: "text-amber-800 bg-amber-50", enabled: true },
    { title: "Customer Support", description: "Built-in ticket system for customer queries", icon: "Headphones", color: "text-indigo-600 bg-indigo-50", enabled: true },
    { title: "Promotions Management", description: "Create and manage discounts and special offers", icon: "Tag", color: "text-pink-600 bg-pink-50", enabled: true }
  ],
  enableFeaturesSection: true,
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function SolarDealerAppFeatures() {
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
    icon: "Boxes",
    color: "text-green-600 bg-green-50",
    enabled: true
  });

  useEffect(() => {
    fetchDealerAppFeatures();
  }, []);

  const fetchDealerAppFeatures = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/website/v1/dealer-app/get?t=${Date.now()}`
      );
      if (response.data?.data) {
        const data = response.data.data;
        setFormData((prev) => {
          const merged = { ...prev };
          for (const key in data) {
            if (key === "featuresList") continue;
            if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
              merged[key] = data[key];
            }
          }
          if (Array.isArray(data.featuresList) && data.featuresList.length > 0) {
            merged.featuresList = data.featuresList.map((item) => ({
              title: item.title || "",
              description: item.description || item.desc || "",
              icon: item.icon || "Boxes",
              color: item.color || "text-green-600 bg-green-50",
              enabled: item.enabled !== undefined ? item.enabled : true
            }));
          }
          if (data.enableFeaturesSection !== undefined) {
            merged.enableFeaturesSection = data.enableFeaturesSection;
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
      icon: "Boxes",
      color: "text-green-600 bg-green-50",
      enabled: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (card, index) => {
    setEditingCard(index);
    setModalForm({
      title: card.title || "",
      description: card.description || "",
      icon: card.icon || "Boxes",
      color: card.color || "text-green-600 bg-green-50",
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
        const updatedList = prev.featuresList.map((c, idx) =>
          idx === editingCard
            ? {
                ...c,
                title: modalForm.title.trim(),
                description: modalForm.description.trim(),
                icon: modalForm.icon,
                color: modalForm.color
              }
            : c
        );
        return { ...prev, featuresList: updatedList };
      });
    } else {
      // Add new card
      const newCard = {
        title: modalForm.title.trim(),
        description: modalForm.description.trim(),
        icon: modalForm.icon,
        color: modalForm.color,
        enabled: true
      };
      setFormData((prev) => ({
        ...prev,
        featuresList: [...prev.featuresList, newCard]
      }));
    }

    setIsModalOpen(false);
    setSavedSuccess(false);
  };

  const handleDeleteCard = (index) => {
    if (window.confirm("Are you sure you want to delete this feature card?")) {
      const updatedList = formData.featuresList.filter((_, idx) => idx !== index);
      setFormData((prev) => ({
        ...prev,
        featuresList: updatedList
      }));
      setSavedSuccess(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset features list to default values?")) {
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
        `${BASE_URL}/api/website/v1/dealer-app/update`,
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
        <p className="text-text/60 font-semibold text-sm">Loading Features Configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="Dealer App - Features List"
        description="Configure titles, subtitles, feature cards, and custom colors of the Dealer App Features grid"
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form panel */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-card border border-border/40 shadow-xl rounded-2xl p-6 space-y-6">
          
          {/* Header configuration fields */}
          <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
            <div className="flex items-center justify-between border-b border-border/25 pb-3 mb-1">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <FiLayers className="text-primary" /> Section Headers
              </h3>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, enableFeaturesSection: !prev.enableFeaturesSection }))}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer select-none ${formData.enableFeaturesSection ? "bg-primary border-primary" : "bg-bg/60 border-border/60"}`}
              >
                <span className={`relative inline-block w-8 h-4 rounded-full transition-colors duration-300 ${formData.enableFeaturesSection ? "bg-white/30" : "bg-border/60"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${formData.enableFeaturesSection ? "translate-x-4" : "translate-x-0"}`} />
                </span>
                <span className={`text-xs font-bold transition-colors duration-300 ${formData.enableFeaturesSection ? "text-white" : "text-text/50"}`}>
                  {formData.enableFeaturesSection ? "Enabled" : "Disabled"}
                </span>
              </button>
            </div>
            <div>
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Section Title</label>
              <input
                type="text"
                name="featuresTitle"
                value={formData.featuresTitle}
                onChange={handleChange}
                required
                className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Section Subtitle</label>
              <input
                type="text"
                name="featuresSubtitle"
                value={formData.featuresSubtitle}
                onChange={handleChange}
                required
                className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
          </div>

          {/* List Table */}
          <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-xl bg-bg/20 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/25">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <FiList className="text-xl" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text">Features List</h2>
                  <p className="text-xs text-text/60">Configure the interactive grid cards</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1 text-xs text-white bg-primary hover:bg-primary/95 transition font-bold px-3.5 py-2 rounded-xl shadow-md cursor-pointer"
              >
                <FiPlus className="text-sm" /> Add Feature
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-border/50 bg-bg/20">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-bg/60 text-text/50 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-12 text-center">Order</th>
                    <th className="py-3 px-4">Feature Title</th>
                    <th className="py-3 px-4">Description Preview</th>
                    <th className="py-3 px-4">Icon Name</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {formData.featuresList.map((card, idx) => (
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
                      <td className="py-3 px-4 text-text/60 line-clamp-1 max-w-[200px] mt-2">
                        {card.description || "-"}
                      </td>
                      <td className="py-3 px-4 text-text/65">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-bg/50 border border-border/40 rounded text-[10px]">
                          {card.icon}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              featuresList: prev.featuresList.map((item, i) =>
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
                            title="Edit Feature"
                          >
                            <FiEdit2 className="text-xs" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition cursor-pointer"
                            title="Delete Feature"
                          >
                            <FiTrash2 className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {formData.featuresList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-text/50">
                        No features found. Click "Add Feature" to create one.
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
              <FiRotateCcw /> Reset Section
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
                  previewMode === "mobile" ? "w-[340px] min-h-[450px]" : "w-full min-h-[350px]"
                }`}
                style={{ fontSize: previewMode === "mobile" ? "10px" : "12px" }}
              >
                <div className="p-6 bg-white text-center">
                  
                  <h2 className="text-base font-extrabold text-gray-800 leading-tight">
                    {formData.featuresTitle}
                  </h2>
                  <p className="text-[9px] text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    {formData.featuresSubtitle}
                  </p>

                  <div className={`mt-6 grid gap-4 ${previewMode === "mobile" ? "grid-cols-1" : "grid-cols-2"}`}>
                    {formData.featuresList.map((sol, i) => {
                      const Icon = ICON_MAP[sol.icon] || Boxes;
                      return (
                        <div key={i} className="bg-white border border-gray-150 p-4 rounded-xl text-left shadow-sm">
                          <div className={`inline-flex rounded-xl p-2 mb-2 ${sol.color || "text-green-600 bg-green-50"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <h3 className="font-bold text-gray-800 text-[10px]">{sol.title}</h3>
                          <p className="text-[8px] text-gray-400 mt-1 line-clamp-3 leading-relaxed">{sol.description}</p>
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
                {editingCard !== null ? "Edit Feature" : "Add Feature"}
              </h3>
              <p className="text-xs text-text/60 mb-5">
                {editingCard !== null ? "Modify the properties of this app feature." : "Create a new app feature card configuration."}
              </p>

              <form onSubmit={handleSaveModalSolution} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">
                    Feature Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalForm.title}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Dashboard Management"
                    required
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={modalForm.description}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide a short description..."
                    required
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">
                    Feature Icon
                  </label>
                  <select
                    value={modalForm.icon}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, icon: e.target.value }))}
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition cursor-pointer"
                  >
                    <option value="Boxes">Boxes Icon</option>
                    <option value="ShoppingCart">ShoppingCart Icon</option>
                    <option value="Users">Users Icon</option>
                    <option value="BarChart3">BarChart3 Icon</option>
                    <option value="CreditCard">CreditCard Icon</option>
                    <option value="Bell">Bell Icon</option>
                    <option value="Calendar">Calendar Icon</option>
                    <option value="Headphones">Headphones Icon</option>
                    <option value="Tag">Tag Icon</option>
                    <option value="ShieldCheck">ShieldCheck Icon</option>
                    <option value="GitCompare">GitCompare Icon</option>
                    <option value="Star">Star Icon</option>
                    <option value="Lock">Lock Icon</option>
                    <option value="Clock">Clock Icon</option>
                    <option value="Smile">Smile Icon</option>
                  </select>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">
                    Badge Theme Color
                  </label>
                  <select
                    value={modalForm.color}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, color: e.target.value }))}
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition cursor-pointer"
                  >
                    {COLOR_OPTIONS.map((opt, i) => (
                      <option key={i} value={opt.class}>{opt.name}</option>
                    ))}
                  </select>
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
                    {editingCard !== null ? "Save Feature" : "Add Feature"}
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
              <h4 className="font-bold text-sm">Features Saved</h4>
              <p className="text-xs text-white/90">Dealer App features updated successfully</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
