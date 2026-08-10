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
import { Star } from "lucide-react";

const DEFAULT_CONFIG = {
  testimonialsTitle: "What Our Partners Say",
  testimonialsList: [
    { name: "Rajesh Kumar", role: "EPC Contractor", company: "SunPower Solutions", testimonial: "The platform has completely transformed how we manage our solar projects. No more inventory headaches! The efficiency gain is remarkable.", rating: 5, enabled: true },
    { name: "Priya Sharma", role: "Solar Dealer", company: "Green Energy Stores", testimonial: "Best decision we made for our business. The dealer app is incredibly user-friendly and efficient. Our sales have increased by 40%.", rating: 5, enabled: true },
    { name: "Amit Patel", role: "Project Manager", company: "MegaSolar Corp", testimonial: "The project management tools are outstanding. We've completed 3MW projects ahead of schedule with better resource utilization.", rating: 5, enabled: true },
    { name: "Sunita Reddy", role: "CEO", company: "SolarTech Industries", testimonial: "The ERP system streamlined our entire operation. From procurement to delivery, everything is now automated and efficient.", rating: 5, enabled: true }
  ],
  enableSection: true,
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function SolarShopTestimonials() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit / Add Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null); // null when adding, index when editing
  const [modalForm, setModalForm] = useState({
    name: "",
    role: "",
    company: "",
    testimonial: "",
    rating: 5,
    enabled: true
  });

  useEffect(() => {
    fetchSolarShopTestimonials();
  }, []);

  const fetchSolarShopTestimonials = async () => {
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
            if (key === "testimonialsList") continue;
            if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
              merged[key] = data[key];
            }
          }
          if (Array.isArray(data.testimonialsList) && data.testimonialsList.length > 0) {
            merged.testimonialsList = data.testimonialsList.map(item => ({
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
      name: "",
      role: "",
      company: "",
      testimonial: "",
      rating: 5,
      enabled: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (card, index) => {
    setEditingCard(index);
    setModalForm({
      name: card.name || "",
      role: card.role || "",
      company: card.company || "",
      testimonial: card.testimonial || "",
      rating: card.rating || 5,
      enabled: card.enabled !== undefined ? card.enabled : true
    });
    setIsModalOpen(true);
  };

  const handleSaveModalSolution = (e) => {
    e.preventDefault();
    if (!modalForm.name.trim()) return;

    if (editingCard !== null) {
      // Update existing card
      setFormData((prev) => {
        const updatedList = prev.testimonialsList.map((c, idx) =>
          idx === editingCard
            ? {
                ...c,
                name: modalForm.name.trim(),
                role: modalForm.role.trim(),
                company: modalForm.company.trim(),
                testimonial: modalForm.testimonial.trim(),
                rating: Number(modalForm.rating)
              }
            : c
        );
        return { ...prev, testimonialsList: updatedList };
      });
    } else {
      // Add new card
      const newCard = {
        name: modalForm.name.trim(),
        role: modalForm.role.trim(),
        company: modalForm.company.trim(),
        testimonial: modalForm.testimonial.trim(),
        rating: Number(modalForm.rating),
        enabled: true
      };
      setFormData((prev) => ({
        ...prev,
        testimonialsList: [...prev.testimonialsList, newCard]
      }));
    }

    setIsModalOpen(false);
    setSavedSuccess(false);
  };

  const handleDeleteCard = (index) => {
    if (window.confirm("Are you sure you want to delete this testimonial?")) {
      const updatedList = formData.testimonialsList.filter((_, idx) => idx !== index);
      setFormData((prev) => ({
        ...prev,
        testimonialsList: updatedList
      }));
      setSavedSuccess(false);
      setActivePreviewIdx(0);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset Testimonials fields to default values?")) {
      setFormData({
        ...formData,
        ...DEFAULT_CONFIG,
      });
      setSavedSuccess(false);
      setActivePreviewIdx(0);
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
        <p className="text-text/60 font-semibold text-sm">Loading Testimonials Configuration...</p>
      </div>
    );
  }

  const activeTestimonial = formData.testimonialsList[activePreviewIdx];

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="Solar Shop - Testimonials"
        description="Configure partners ratings, feedback text, authors, roles, and company details for the testimonial slider section"
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form panel */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-card border border-border/40 shadow-xl rounded-2xl p-6 space-y-6">
          
          {/* Header configuration fields */}
          <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
            <div className="flex items-center justify-between border-b border-border/25 pb-3 mb-1">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <FiLayers className="text-primary" /> Testimonials Headers
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
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Testimonials Section Title</label>
              <input
                type="text"
                name="testimonialsTitle"
                value={formData.testimonialsTitle}
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
                  <h2 className="text-sm font-bold text-text">Testimonials List</h2>
                  <p className="text-xs text-text/60">Configure partner feedback quotes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1 text-xs text-white bg-primary hover:bg-primary/95 transition font-bold px-3.5 py-2 rounded-xl shadow-md cursor-pointer"
              >
                <FiPlus className="text-sm" /> Add Testimonial
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-border/50 bg-bg/20">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-bg/60 text-text/50 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-12 text-center">Order</th>
                    <th className="py-3 px-4">Author Name</th>
                    <th className="py-3 px-4">Role & Company</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {formData.testimonialsList.map((card, idx) => (
                    <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-text/60 font-bold">
                          <FiGrid className="text-xs text-text/30" />
                          <span>{idx + 1}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-text">
                        {card.name || "Anonymous"}
                      </td>
                      <td className="py-3 px-4 text-text/60">
                        {card.role} ({card.company})
                      </td>
                      <td className="py-3 px-4 text-text/65 text-amber-500 font-bold">
                        {"★".repeat(card.rating || 5)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              testimonialsList: prev.testimonialsList.map((item, i) =>
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
                            title="Edit Testimonial"
                          >
                            <FiEdit2 className="text-xs" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition cursor-pointer"
                            title="Delete Testimonial"
                          >
                            <FiTrash2 className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {formData.testimonialsList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-text/50">
                        No testimonials found. Click "Add Testimonial" to create one.
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
                  previewMode === "mobile" ? "w-[340px] min-h-[300px]" : "w-full min-h-[220px]"
                }`}
                style={{ fontSize: previewMode === "mobile" ? "10px" : "12px" }}
              >
                <div className="p-6 bg-white text-center">
                  
                  <h2 className="text-base font-extrabold text-gray-800 leading-tight">
                    {formData.testimonialsTitle}
                  </h2>

                  {activeTestimonial ? (
                    <div className="bg-white border border-gray-150 p-6 rounded-2xl text-center shadow-sm max-w-sm mx-auto mt-6">
                      <div className="flex justify-center gap-1 text-amber-500 mb-3 text-sm">
                        {Array.from({ length: activeTestimonial.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-500 italic leading-relaxed">
                        "{activeTestimonial.testimonial}"
                      </p>
                      <h4 className="font-extrabold text-gray-800 mt-3 text-xs">{activeTestimonial.name}</h4>
                      <p className="text-[8px] text-gray-400 mt-0.5">{activeTestimonial.role}, {activeTestimonial.company}</p>
                    </div>
                  ) : (
                    <div className="py-12 text-gray-400 text-xs">No active testimonials configured.</div>
                  )}

                  {/* Slider dot navigation in preview */}
                  <div className="flex justify-center gap-2 mt-4">
                    {formData.testimonialsList.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={() => setActivePreviewIdx(dotIdx)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          dotIdx === activePreviewIdx ? "w-6 bg-primary" : "w-2 bg-gray-200"
                        }`}
                      />
                    ))}
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
                {editingCard !== null ? "Edit Testimonial" : "Add Testimonial"}
              </h3>
              <p className="text-xs text-text/60 mb-5">
                {editingCard !== null ? "Modify the properties of this testimonial card." : "Create a new testimonial config."}
              </p>

              <form onSubmit={handleSaveModalSolution} className="space-y-4">
                {/* Author Name */}
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">
                    Author Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalForm.name}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Amit Patel"
                    required
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>

                {/* Role & Company */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text mb-1.5">
                      Role / Position <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={modalForm.role}
                      onChange={(e) => setModalForm((prev) => ({ ...prev, role: e.target.value }))}
                      placeholder="e.g., Project Manager"
                      required
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text mb-1.5">
                      Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={modalForm.company}
                      onChange={(e) => setModalForm((prev) => ({ ...prev, company: e.target.value }))}
                      placeholder="e.g., MegaSolar Corp"
                      required
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                </div>

                {/* Rating (1-5 star) */}
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">
                    Rating (Stars)
                  </label>
                  <select
                    value={modalForm.rating}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition cursor-pointer"
                  >
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>

                {/* Testimonial Quote */}
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">
                    Feedback Quote <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={modalForm.testimonial}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, testimonial: e.target.value }))}
                    placeholder="Type the partner feedback quotation here..."
                    required
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
                  />
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
                    {editingCard !== null ? "Save Testimonial" : "Add Testimonial"}
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
              <h4 className="font-bold text-sm">Testimonials Saved</h4>
              <p className="text-xs text-white/90">Solar Shop section updated successfully</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
