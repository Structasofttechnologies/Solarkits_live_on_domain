import React, { useState, useEffect, useCallback } from "react";
import {
  listIndustryContent,
  getIndustryContentDetail,
  createIndustryContent,
  updateIndustryContent,
  uploadContentMedia,
  deleteContentMedia,
  setContentIndustries,
  publishContent,
  unpublishContent,
  scheduleContent,
  archiveContent,
  getIndustryTypes,
} from "../../../api/industryContentApi";
import ContentStatusBadge from "../../../components/industry/ContentStatusBadge";
import MediaUploadZone from "../../../components/industry/MediaUploadZone";
import ContentPreviewModal from "../../../components/industry/ContentPreviewModal";
import SchedulePickerModal from "../../../components/industry/SchedulePickerModal";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiPlay,
  FiEye,
  FiPause,
  FiCalendar,
  FiArchive,
  FiLayers,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiUploadCloud,
  FiSliders,
} from "react-icons/fi";
import { MdOutlineDashboardCustomize, MdOutlineVideoLibrary } from "react-icons/md";

const CONTENT_TYPES = [
  { value: "HERO_BANNER", label: "Hero Banner" },
  { value: "IMAGE_SLIDER", label: "Image Slider" },
  { value: "VIDEO_SLIDER", label: "Video Slider" },
  { value: "EXPLAINER_VIDEO", label: "Explainer Video" },
  { value: "PROMOTIONAL_CARD", label: "Promotional Card" },
  { value: "ANNOUNCEMENT", label: "Announcement" },
];

const PLACEMENTS = [
  { value: "DASHBOARD_TOP", label: "Dashboard Top" },
  { value: "DASHBOARD_MIDDLE", label: "Dashboard Middle" },
  { value: "DASHBOARD_BOTTOM", label: "Dashboard Bottom" },
  { value: "STOREFRONT_TOP", label: "Storefront Top" },
  { value: "PRODUCT_LISTING", label: "Product Listing" },
  { value: "PRODUCT_DETAILS", label: "Product Details" },
  { value: "CHECKOUT_INFORMATION", label: "Checkout Info" },
];

export default function IndustryContentManagement() {
  const [contentList, setContentList] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Filters
  const [selectedType, setSelectedType] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("");
  const [selectedIndustryFilter, setSelectedIndustryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [schedulingItem, setSchedulingItem] = useState(null);

  // Editor Form state
  const [formStep, setFormStep] = useState(1); // 1: Details, 2: Industries, 3: Media
  const [title, setTitle] = useState("");
  const [internalName, setInternalName] = useState("");
  const [contentType, setContentType] = useState("HERO_BANNER");
  const [targetAudience, setTargetAudience] = useState("BOTH");
  const [placement, setPlacement] = useState("DASHBOARD_TOP");
  const [heading, setHeading] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [priority, setPriority] = useState(0);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [muted, setMuted] = useState(true);
  const [loop, setLoop] = useState(false);
  const [assignedIndustryIds, setAssignedIndustryIds] = useState([]);
  const [activeMediaList, setActiveMediaList] = useState([]);
  const [saving, setSaving] = useState(false);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // 1. Fetch industry types
  useEffect(() => {
    getIndustryTypes()
      .then((res) => {
        if (res.status === "success") setIndustries(res.data || []);
      })
      .catch((err) => console.error(err));
  }, []);

  // 2. Fetch content list
  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedType) params.content_type = selectedType;
      if (selectedAudience) params.target_audience = selectedAudience;
      if (selectedIndustryFilter) params.industry_type_id = selectedIndustryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await listIndustryContent(params);
      if (res.status === "success") {
        setContentList(res.data || []);
      }
    } catch (err) {
      console.error("fetchContent error:", err);
      showAlert("error", err.response?.data?.message || "Failed to fetch content list");
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedAudience, selectedIndustryFilter, searchQuery]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingContent(null);
    setFormStep(1);
    setTitle("");
    setInternalName("");
    setContentType("HERO_BANNER");
    setTargetAudience("BOTH");
    setPlacement("DASHBOARD_TOP");
    setHeading("");
    setShortDescription("");
    setCtaLabel("");
    setCtaUrl("");
    setPriority(0);
    setDisplayOrder(0);
    setAutoplay(false);
    setShowControls(true);
    setMuted(true);
    setLoop(false);
    setAssignedIndustryIds([]);
    setActiveMediaList([]);
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = async (item) => {
    setSaving(true);
    try {
      const res = await getIndustryContentDetail(item.id || item._id);
      if (res.status === "success") {
        const c = res.data;
        setEditingContent(c);
        setFormStep(1);
        setTitle(c.title || "");
        setInternalName(c.internal_name || "");
        setContentType(c.content_type || "HERO_BANNER");
        setTargetAudience(c.target_audience || "BOTH");
        setPlacement(c.placement || "DASHBOARD_TOP");
        setHeading(c.heading || "");
        setShortDescription(c.short_description || "");
        setCtaLabel(c.cta_label || "");
        setCtaUrl(c.cta_url || "");
        setPriority(c.priority || 0);
        setDisplayOrder(c.display_order || 0);
        setAutoplay(!!c.autoplay);
        setShowControls(c.show_controls !== false);
        setMuted(c.muted !== false);
        setLoop(!!c.loop);
        setAssignedIndustryIds((c.industries || []).map((i) => i.id || i._id));
        setActiveMediaList(c.media || []);
        setIsEditorOpen(true);
      }
    } catch (err) {
      showAlert("error", "Failed to load content details");
    } finally {
      setSaving(false);
    }
  };

  // Save Content Details
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!title.trim() || !internalName.trim()) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        internal_name: internalName.trim(),
        content_type: contentType,
        target_audience: targetAudience,
        placement,
        heading: heading.trim() || null,
        short_description: shortDescription.trim() || null,
        cta_label: ctaLabel.trim() || null,
        cta_url: ctaUrl.trim() || null,
        priority: Number(priority),
        display_order: Number(displayOrder),
        autoplay,
        show_controls: showControls,
        muted,
        loop,
        industry_ids: assignedIndustryIds,
      };

      if (editingContent) {
        const res = await updateIndustryContent(editingContent.id || editingContent._id, payload);
        await setContentIndustries(editingContent.id || editingContent._id, { industry_ids: assignedIndustryIds });
        setEditingContent(res.data);
        showAlert("success", "Content details updated! Now manage media assets.");
        setFormStep(3); // jump to media
      } else {
        const res = await createIndustryContent(payload);
        setEditingContent(res.data);
        showAlert("success", "Draft created! Now upload media assets.");
        setFormStep(3); // jump to media
      }

      fetchContent();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  // Media handlers
  const handleUploadFile = async (formData) => {
    if (!editingContent) return;
    try {
      const res = await uploadContentMedia(editingContent.id || editingContent._id, formData);
      if (res.status === "success") {
        showAlert("success", "Media uploaded successfully");
        // Refresh details
        const detailRes = await getIndustryContentDetail(editingContent.id || editingContent._id);
        setActiveMediaList(detailRes.data?.media || []);
      }
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Media upload failed");
    }
  };

  const handleUploadExternal = async (data) => {
    if (!editingContent) return;
    try {
      const res = await uploadContentMedia(editingContent.id || editingContent._id, data);
      if (res.status === "success") {
        showAlert("success", "External media link attached");
        const detailRes = await getIndustryContentDetail(editingContent.id || editingContent._id);
        setActiveMediaList(detailRes.data?.media || []);
      }
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to attach link");
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm("Are you sure you want to delete this media asset?")) return;
    try {
      await deleteContentMedia(mediaId);
      showAlert("success", "Media asset removed");
      setActiveMediaList((prev) => prev.filter((m) => (m.id || m._id) !== mediaId));
    } catch (err) {
      showAlert("error", "Failed to delete media");
    }
  };

  // Industry chip toggle
  const handleToggleIndustryChip = (id) => {
    setAssignedIndustryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Lifecycle actions
  const handlePublish = async (item) => {
    try {
      await publishContent(item.id || item._id);
      showAlert("success", `"${item.title}" published successfully!`);
      fetchContent();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to publish content");
    }
  };

  const handleUnpublish = async (item) => {
    try {
      await unpublishContent(item.id || item._id);
      showAlert("success", `"${item.title}" paused`);
      fetchContent();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to pause content");
    }
  };

  const handleArchive = async (item) => {
    if (!window.confirm(`Archive "${item.title}"? It will be deactivated from all dashboards.`)) return;
    try {
      await archiveContent(item.id || item._id);
      showAlert("success", `"${item.title}" archived`);
      fetchContent();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to archive content");
    }
  };

  const handleSaveSchedule = async (scheduleData) => {
    if (!schedulingItem) return;
    try {
      await scheduleContent(schedulingItem.id || schedulingItem._id, scheduleData);
      showAlert("success", "Content scheduled successfully!");
      setSchedulingItem(null);
      fetchContent();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to schedule content");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <MdOutlineDashboardCustomize size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Industry Content Management (CMS)</h1>
            <p className="text-xs font-medium text-slate-500">
              Manage hero banners, video sliders, explainer videos, and promotional cards by industry & audience
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchContent}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Refresh List"
          >
            <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-black rounded-2xl text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
          >
            <FiPlus size={16} /> Create Content
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            alert.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <FiAlertCircle size={16} />
          <span>{alert.message}</span>
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          
          {/* Search */}
          <div className="relative min-w-[200px]">
            <FiSearch className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search content by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-9 pr-3 py-2 font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Content Types</option>
            {CONTENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Audience Filter */}
          <select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Audiences</option>
            <option value="RESELLER">Resellers Only</option>
            <option value="EPC">EPC Buyers Only</option>
            <option value="BOTH">Both Audiences</option>
          </select>

          {/* Industry Filter */}
          <select
            value={selectedIndustryFilter}
            onChange={(e) => setSelectedIndustryFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Industry Segments</option>
            {industries.map((ind) => (
              <option key={ind.id || ind._id} value={ind.id || ind._id}>
                {ind.name}
              </option>
            ))}
          </select>
        </div>

        {(selectedType || selectedAudience || selectedIndustryFilter || searchQuery) && (
          <button
            onClick={() => {
              setSelectedType("");
              setSelectedAudience("");
              setSelectedIndustryFilter("");
              setSearchQuery("");
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 font-bold animate-pulse">
            Loading CMS content items...
          </div>
        ) : contentList.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <MdOutlineVideoLibrary size={40} className="mx-auto text-slate-300" />
            <p className="font-bold text-sm text-slate-600 dark:text-slate-300">No content items found</p>
            <p className="text-xs text-slate-400">Create a hero banner, video slider, or explainer video above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-6">Content Title & Type</th>
                  <th className="py-4 px-6">Placement & Target</th>
                  <th className="py-4 px-6">Assigned Industries</th>
                  <th className="py-4 px-6">Priority</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {contentList.map((item) => (
                  <tr key={item.id || item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    
                    {/* Title & Type */}
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <p className="font-black text-slate-900 dark:text-white text-sm">{item.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                            {item.content_type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-slate-400">Internal: {item.internal_name}</span>
                        </div>
                      </div>
                    </td>

                    {/* Placement & Target */}
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block">
                          {item.placement.replace(/_/g, " ")}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                          {item.target_audience}
                        </span>
                      </div>
                    </td>

                    {/* Assigned Industries */}
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(item.industries || []).length === 0 ? (
                          <span className="text-[11px] text-rose-500 font-bold">No Industries!</span>
                        ) : (
                          (item.industries || []).map((ind) => (
                            <span
                              key={ind.id || ind._id}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold"
                            >
                              {ind.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-6 font-black text-slate-700 dark:text-slate-300">{item.priority}</td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      <ContentStatusBadge status={item.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Live Preview */}
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Simulate Device Preview"
                        >
                          <FiEye size={14} />
                        </button>

                        {/* Publish / Unpublish */}
                        {item.status === "PUBLISHED" ? (
                          <button
                            onClick={() => handleUnpublish(item)}
                            className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                            title="Pause Content"
                          >
                            <FiPause size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublish(item)}
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Publish Now"
                          >
                            <FiPlay size={14} />
                          </button>
                        )}

                        {/* Schedule */}
                        <button
                          onClick={() => setSchedulingItem(item)}
                          className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                          title="Schedule Publishing"
                        >
                          <FiCalendar size={14} />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer"
                          title="Edit Details & Media"
                        >
                          <FiEdit2 size={14} />
                        </button>

                        {/* Archive */}
                        <button
                          onClick={() => handleArchive(item)}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          title="Archive Content"
                        >
                          <FiArchive size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Full Wizard Modal ────────────────────────────────── */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">Content Studio</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {editingContent ? `Edit: ${editingContent.title}` : "Create New Industry Content"}
                </h3>
              </div>

              {/* Wizard Steps */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormStep(1)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    formStep === 1 ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  1. Details & Copy
                </button>
                <button
                  type="button"
                  onClick={() => setFormStep(2)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    formStep === 2 ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  2. Industry Targets ({assignedIndustryIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFormStep(3)}
                  disabled={!editingContent}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    formStep === 3 ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  } ${!editingContent ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  3. Media Assets ({activeMediaList.length})
                </button>
              </div>

              <button
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* STEP 1: Details Form */}
              {formStep === 1 && (
                <form onSubmit={handleSaveDetails} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Content Title (Public) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Turnkey Industrial Rooftop Solutions"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Internal Reference Code / Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HERO_COMMERCIAL_Q3_2026"
                        value={internalName}
                        onChange={(e) => setInternalName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Content Type</label>
                      <select
                        value={contentType}
                        onChange={(e) => setContentType(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2.5 font-semibold text-slate-800 dark:text-white focus:outline-none"
                      >
                        {CONTENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Audience</label>
                      <select
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2.5 font-semibold text-slate-800 dark:text-white focus:outline-none"
                      >
                        <option value="BOTH">Both Resellers & EPC Buyers</option>
                        <option value="RESELLER">Resellers Only</option>
                        <option value="EPC">EPC Buyers Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Dashboard Placement</label>
                      <select
                        value={placement}
                        onChange={(e) => setPlacement(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2.5 font-semibold text-slate-800 dark:text-white focus:outline-none"
                      >
                        {PLACEMENTS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Headline / Display Heading
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Scale Your Solar Installations with High-Capacity Inverters"
                      value={heading}
                      onChange={(e) => setHeading(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Short Description / Subheading
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Concise educational or promotional copy shown on the banner/card..."
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">CTA Button Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Explore Solar Kits, Watch Demo"
                        value={ctaLabel}
                        onChange={(e) => setCtaLabel(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">CTA Target URL</label>
                      <input
                        type="text"
                        placeholder="e.g. /catalog or https://..."
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Priority Weight</label>
                      <input
                        type="number"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 font-semibold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Display Order</label>
                      <input
                        type="number"
                        value={displayOrder}
                        onChange={(e) => setDisplayOrder(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 font-semibold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Video Playback Options */}
                  {(contentType === "VIDEO_SLIDER" || contentType === "EXPLAINER_VIDEO" || contentType === "HERO_BANNER") && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <label className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                        Video Playback Options
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoplay}
                            onChange={(e) => setAutoplay(e.target.checked)}
                            className="rounded border-slate-300 text-primary h-4 w-4"
                          />
                          <span>Autoplay</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={muted}
                            onChange={(e) => setMuted(e.target.checked)}
                            className="rounded border-slate-300 text-primary h-4 w-4"
                          />
                          <span>Muted by default</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={loop}
                            onChange={(e) => setLoop(e.target.checked)}
                            className="rounded border-slate-300 text-primary h-4 w-4"
                          />
                          <span>Loop Playback</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showControls}
                            onChange={(e) => setShowControls(e.target.checked)}
                            className="rounded border-slate-300 text-primary h-4 w-4"
                          />
                          <span>Show Controls</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex items-center justify-end gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-primary text-white font-black rounded-2xl text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      {saving ? "Saving..." : "Save & Continue to Industries →"}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Industry Targets */}
              {formStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Assign Target Industry Segments
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Select which industries should display this content on their dashboards.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {industries.map((ind) => {
                      const id = ind.id || ind._id;
                      const isSelected = assignedIndustryIds.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleToggleIndustryChip(id)}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{ind.icon || "🏭"}</span>
                            <div>
                              <p className="font-bold text-xs">{ind.name}</p>
                              <span className="text-[10px] text-slate-400">{ind.code || "Segment"}</span>
                            </div>
                          </div>
                          {isSelected && <FiCheck size={16} className="text-primary" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setFormStep(1)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs hover:bg-slate-200 cursor-pointer"
                    >
                      ← Back to Details
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormStep(3)}
                      className="px-6 py-2.5 bg-primary text-white font-black rounded-2xl text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      Continue to Media Assets →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Media Uploads */}
              {formStep === 3 && (
                <div className="space-y-4">
                  <MediaUploadZone
                    mediaList={activeMediaList}
                    onUploadFile={handleUploadFile}
                    onUploadExternalUrl={handleUploadExternal}
                    onDeleteMedia={handleDeleteMedia}
                    loading={saving}
                  />

                  <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFormStep(2)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs hover:bg-slate-200 cursor-pointer"
                    >
                      ← Back to Industry Targets
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsEditorOpen(false);
                        fetchContent();
                      }}
                      className="px-6 py-2.5 bg-emerald-600 text-white font-black rounded-2xl text-xs shadow-md hover:bg-emerald-700 transition-all cursor-pointer"
                    >
                      Done & Save Content
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Simulated Device Preview Modal */}
      {previewItem && (
        <ContentPreviewModal
          content={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}

      {/* Schedule Picker Modal */}
      {schedulingItem && (
        <SchedulePickerModal
          content={schedulingItem}
          onSaveSchedule={handleSaveSchedule}
          onClose={() => setSchedulingItem(null)}
        />
      )}

    </div>
  );
}
