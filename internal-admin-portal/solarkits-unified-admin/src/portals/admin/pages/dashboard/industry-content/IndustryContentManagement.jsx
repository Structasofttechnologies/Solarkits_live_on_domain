import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  toggleActiveIndustryContent,
  duplicateIndustryContent,
  bulkActionIndustryContent,
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
  FiSliders,
  FiGrid,
  FiList,
  FiCopy,
  FiMaximize2,
  FiDownload,
  FiShare2,
  FiArrowRight,
  FiCheckSquare,
  FiSquare,
  FiMonitor,
  FiClock,
  FiImage,
  FiFileText,
  FiVideo,
} from "react-icons/fi";
import { MdOutlineDashboardCustomize, MdOutlineFactory } from "react-icons/md";

const CONTENT_TYPES = [
  { value: "HERO_BANNER", label: "Hero Banner", icon: FiMonitor },
  { value: "VIDEO", label: "Video Showcase", icon: FiVideo },
  { value: "PHOTO", label: "Photo / Project", icon: FiImage },
  { value: "POSTER", label: "Product Poster", icon: FiFileText },
  { value: "GALLERY", label: "Photo Album", icon: FiLayers },
  { value: "EXPLAINER_VIDEO", label: "Explainer Video", icon: FiPlay },
  { value: "IMAGE_SLIDER", label: "Image Slider", icon: FiImage },
  { value: "VIDEO_SLIDER", label: "Video Slider", icon: FiVideo },
];

const PLACEMENTS = [
  { value: "HERO", label: "Hero Banner (Top Visual)" },
  { value: "GALLERY", label: "Main Gallery Grid" },
  { value: "POSTER_HIGHLIGHT", label: "Poster Highlight" },
  { value: "VIDEO_HIGHLIGHT", label: "Video Highlight" },
  { value: "DASHBOARD_TOP", label: "Dashboard Top" },
  { value: "STOREFRONT_TOP", label: "Storefront Top" },
];

const FOCAL_POINTS = [
  { value: "center", label: "Center (Default)" },
  { value: "top", label: "Top (Heads & Skylines)" },
  { value: "bottom", label: "Bottom (Ground & Hardware)" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

export default function IndustryContentManagement() {
  const [activeTab, setActiveTab] = useState("ALL_MEDIA"); // ALL_MEDIA, ADD_MEDIA, INDUSTRIES, RESELLER_PREVIEW, DISTRIBUTOR_PREVIEW, DRAFTS
  const [viewMode, setViewMode] = useState("GRID"); // GRID or TABLE
  const [contentList, setContentList] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Filters
  const [selectedType, setSelectedType] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("");
  const [selectedIndustryFilter, setSelectedIndustryFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [schedulingItem, setSchedulingItem] = useState(null);

  // Editor Form state (3-Step Wizard)
  const [formStep, setFormStep] = useState(1); // 1: Content & Copy, 2: Targeting & CTAs, 3: Media & Settings
  const [title, setTitle] = useState("");
  const [internalName, setInternalName] = useState("");
  const [contentType, setContentType] = useState("HERO_BANNER");
  const [targetAudience, setTargetAudience] = useState("BOTH");
  const [placement, setPlacement] = useState("HERO");
  const [heading, setHeading] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [resellerCtaLabel, setResellerCtaLabel] = useState("");
  const [resellerCtaUrl, setResellerCtaUrl] = useState("");
  const [distributorCtaLabel, setDistributorCtaLabel] = useState("");
  const [distributorCtaUrl, setDistributorCtaUrl] = useState("");
  const [priority, setPriority] = useState(0);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [focalPosition, setFocalPosition] = useState("center");
  const [isFeatured, setIsFeatured] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowShare, setAllowShare] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [assignedIndustryIds, setAssignedIndustryIds] = useState([]);
  const [activeMediaList, setActiveMediaList] = useState([]);
  const [saving, setSaving] = useState(false);

  // Live preview interactive state
  const [previewAudience, setPreviewAudience] = useState("RESELLER");
  const [previewIndustryId, setPreviewIndustryId] = useState("");

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // Fetch Industries
  const fetchIndustries = useCallback(async () => {
    try {
      const res = await getIndustryTypes();
      if (res.status === "success" || res.success) {
        const list = res.data || [];
        setIndustries(list);
        if (list.length > 0 && !previewIndustryId) {
          setPreviewIndustryId(list[0]._id || list[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load industries:", err);
    }
  }, [previewIndustryId]);

  // Fetch Contents
  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedType) params.content_type = selectedType;
      if (selectedAudience) params.target_audience = selectedAudience;
      if (selectedIndustryFilter) params.industry_type_id = selectedIndustryFilter;
      if (selectedStatusFilter) params.status = selectedStatusFilter;
      if (searchQuery) params.search = searchQuery;

      if (activeTab === "DRAFTS") {
        params.status = "DRAFT";
      }

      const res = await listIndustryContent(params);
      if (res.status === "success" || res.success) {
        setContentList(res.data?.contents || res.data || []);
      }
    } catch (err) {
      console.error("Failed to load content list:", err);
      showAlert("error", "Failed to load industry content.");
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedAudience, selectedIndustryFilter, selectedStatusFilter, searchQuery, activeTab]);

  useEffect(() => {
    fetchIndustries();
  }, [fetchIndustries]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  // Reset editor form
  const resetForm = () => {
    setEditingContent(null);
    setFormStep(1);
    setTitle("");
    setInternalName("");
    setContentType("HERO_BANNER");
    setTargetAudience("BOTH");
    setPlacement("HERO");
    setHeading("");
    setShortDescription("");
    setCtaLabel("");
    setCtaUrl("");
    setResellerCtaLabel("");
    setResellerCtaUrl("");
    setDistributorCtaLabel("");
    setDistributorCtaUrl("");
    setPriority(0);
    setDisplayOrder(0);
    setFocalPosition("center");
    setIsFeatured(false);
    setAllowDownload(true);
    setAllowShare(true);
    setAutoplay(false);
    setAssignedIndustryIds([]);
    setActiveMediaList([]);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsEditorOpen(true);
  };

  const handleOpenEditModal = async (item) => {
    resetForm();
    setEditingContent(item);
    setTitle(item.title || "");
    setInternalName(item.internal_name || "");
    setContentType(item.content_type || "HERO_BANNER");
    setTargetAudience(item.target_audience || "BOTH");
    setPlacement(item.placement || "HERO");
    setHeading(item.heading || "");
    setShortDescription(item.short_description || "");
    setCtaLabel(item.cta_label || "");
    setCtaUrl(item.cta_url || "");
    setResellerCtaLabel(item.reseller_cta_label || "");
    setResellerCtaUrl(item.reseller_cta_url || "");
    setDistributorCtaLabel(item.distributor_cta_label || "");
    setDistributorCtaUrl(item.distributor_cta_url || "");
    setPriority(item.priority || 0);
    setDisplayOrder(item.display_order || 0);
    setFocalPosition(item.focal_position || "center");
    setIsFeatured(Boolean(item.is_featured));
    setAllowDownload(item.allow_download !== undefined ? item.allow_download : true);
    setAllowShare(item.allow_share !== undefined ? item.allow_share : true);
    setAutoplay(Boolean(item.autoplay));

    // Map industry IDs
    const indIds = (item.industries || []).map((i) => i.id || i._id || i.industry_type_id || i);
    setAssignedIndustryIds(indIds);

    // Fetch media details
    try {
      const detailRes = await getIndustryContentDetail(item.id || item._id);
      if (detailRes.status === "success" || detailRes.success) {
        const d = detailRes.data?.content || detailRes.data;
        setActiveMediaList(d.media || []);
      }
    } catch (_) {
      setActiveMediaList(item.media || []);
    }

    setIsEditorOpen(true);
  };

  // Save content
  const handleSaveContent = async () => {
    if (!title.trim()) {
      showAlert("error", "Content Title is required.");
      setFormStep(1);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        internal_name: internalName.trim() || title.trim(),
        content_type: contentType,
        target_audience: targetAudience,
        placement,
        heading: heading.trim(),
        short_description: shortDescription.trim(),
        cta_label: ctaLabel.trim(),
        cta_url: ctaUrl.trim(),
        reseller_cta_label: resellerCtaLabel.trim(),
        reseller_cta_url: resellerCtaUrl.trim(),
        distributor_cta_label: distributorCtaLabel.trim(),
        distributor_cta_url: distributorCtaUrl.trim(),
        priority: Number(priority),
        display_order: Number(displayOrder),
        focal_position: focalPosition,
        is_featured: isFeatured,
        allow_download: allowDownload,
        allow_share: allowShare,
        autoplay,
        industry_type_ids: assignedIndustryIds,
      };

      let savedId = editingContent?._id || editingContent?.id;

      if (editingContent) {
        await updateIndustryContent(savedId, payload);
        showAlert("success", "Media content updated successfully!");
      } else {
        const createRes = await createIndustryContent(payload);
        savedId = createRes.data?.id || createRes.data?._id || createRes.data?.content?._id;
        showAlert("success", "Media content created successfully!");
      }

      // Save industry assignments
      if (savedId && assignedIndustryIds.length > 0) {
        await setContentIndustries(savedId, { industry_type_ids: assignedIndustryIds });
      }

      setIsEditorOpen(false);
      fetchContents();
    } catch (err) {
      console.error("Save content error:", err);
      showAlert("error", err.response?.data?.message || "Failed to save content.");
    } finally {
      setSaving(false);
    }
  };

  // Media upload handlers in step 3
  const handleUploadFile = async (formData) => {
    const id = editingContent?._id || editingContent?.id;
    if (!id) {
      showAlert("error", "Please save content details first before uploading media.");
      return;
    }
    try {
      const res = await uploadContentMedia(id, formData);
      if (res.status === "success" || res.success) {
        setActiveMediaList((prev) => [...prev, res.data?.media || res.data]);
        showAlert("success", "Media file uploaded successfully!");
      }
    } catch (err) {
      showAlert("error", "Upload failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUploadExternalUrl = async (body) => {
    const id = editingContent?._id || editingContent?.id;
    if (!id) {
      showAlert("error", "Please save content details first.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("external_url", body.external_url);
      formData.append("media_type", body.media_type);
      formData.append("device_type", body.device_type);
      formData.append("is_primary", body.is_primary ? "true" : "false");

      const res = await uploadContentMedia(id, formData);
      if (res.status === "success" || res.success) {
        setActiveMediaList((prev) => [...prev, res.data?.media || res.data]);
        showAlert("success", "External URL attached successfully!");
      }
    } catch (err) {
      showAlert("error", "Failed to attach media: " + err.message);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    try {
      await deleteContentMedia(mediaId);
      setActiveMediaList((prev) => prev.filter((m) => (m._id || m.id) !== mediaId));
      showAlert("success", "Media item removed.");
    } catch (err) {
      showAlert("error", "Failed to delete media.");
    }
  };

  // Quick Action Handlers
  const handleToggleActive = async (item) => {
    try {
      const id = item.id || item._id;
      const res = await toggleActiveIndustryContent(id);
      if (res.status === "success" || res.success) {
        setContentList((prev) =>
          prev.map((c) => ((c.id || c._id) === id ? { ...c, is_active: !c.is_active } : c))
        );
        showAlert("success", `Media ${item.is_active ? "paused" : "activated"}.`);
      }
    } catch (err) {
      showAlert("error", "Failed to toggle active status.");
    }
  };

  const handleDuplicate = async (item) => {
    try {
      const id = item.id || item._id;
      const res = await duplicateIndustryContent(id);
      if (res.status === "success" || res.success) {
        showAlert("success", `Duplicated "${item.title}" successfully!`);
        fetchContents();
      }
    } catch (err) {
      showAlert("error", "Failed to duplicate content.");
    }
  };

  const handlePublish = async (id) => {
    try {
      await publishContent(id);
      showAlert("success", "Content published live!");
      fetchContents();
    } catch (err) {
      showAlert("error", "Failed to publish.");
    }
  };

  const handleUnpublish = async (id) => {
    try {
      await unpublishContent(id);
      showAlert("success", "Content unpublished (moved to Draft).");
      fetchContents();
    } catch (err) {
      showAlert("error", "Failed to unpublish.");
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm("Archive this media content? It will no longer show in partner apps.")) return;
    try {
      await archiveContent(id);
      showAlert("success", "Content archived.");
      fetchContents();
    } catch (err) {
      showAlert("error", "Failed to archive.");
    }
  };

  // Bulk Actions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(contentList.map((c) => c.id || c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action) => {
    if (!selectedIds.length) return;
    if (action === "delete" && !window.confirm(`Permanently delete ${selectedIds.length} items?`)) return;

    try {
      await bulkActionIndustryContent({ ids: selectedIds, action });
      showAlert("success", `Bulk ${action} completed successfully!`);
      setSelectedIds([]);
      fetchContents();
    } catch (err) {
      showAlert("error", "Bulk action failed: " + (err.response?.data?.message || err.message));
    }
  };

  // Filtered live preview items
  const previewItemsForIndustry = useMemo(() => {
    return contentList.filter((c) => {
      const matchAudience =
        previewAudience === "RESELLER"
          ? c.target_audience === "RESELLER" || c.target_audience === "BOTH"
          : c.target_audience === "DISTRIBUTOR" || c.target_audience === "BOTH" || c.target_audience === "EPC";

      const matchIndustry =
        !previewIndustryId ||
        c.industries?.some((i) => (i.id || i._id || i) === previewIndustryId);

      return matchAudience && matchIndustry && c.is_active;
    });
  }, [contentList, previewAudience, previewIndustryId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Top Header & Sub-Navigation Tabs ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider">
                Industry CMS
              </span>
              <span className="text-xs text-slate-400 font-bold">Media Showcase v2.0</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
              Industry Media & Poster Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Curate and publish high-resolution photos, posters, and 4K videos segmented by industry for Resellers and Distributors.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-2xl bg-[#185ADB] hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <FiPlus size={16} />
              <span>Create New Media</span>
            </button>
          </div>
        </div>

        {/* ── Sub-Navigation Tabs ────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-100 dark:border-slate-800 pt-4 scrollbar-thin">
          {[
            { id: "ALL_MEDIA", label: "All Media Assets", icon: FiGrid },
            { id: "DRAFTS", label: "Drafts & Scheduled", icon: FiClock },
            { id: "Franchise_PREVIEW", label: "Franchise Showcase Preview", icon: FiEye },
            { id: "DISTRIBUTOR_PREVIEW", label: "Distributor Showcase Preview", icon: FiMonitor },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "Franchise_PREVIEW") setPreviewAudience("RESELLER");
                  if (tab.id === "DISTRIBUTOR_PREVIEW") setPreviewAudience("DISTRIBUTOR");
                }}
                className={`
                  shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer select-none
                  ${isActive
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900"
                  }
                `}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Alert Toast ──────────────────────────────────────────────────────── */}
      {alert && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold shadow-sm animate-in fade-in duration-200 ${alert.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
        >
          {alert.type === "success" ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* ── Tab: Live Partner Preview ────────────────────────────────────────── */}
      {(activeTab === "RESELLER_PREVIEW" || activeTab === "DISTRIBUTOR_PREVIEW") && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                LIVE INTERACTIVE SIMULATION
              </span>
              <h2 className="text-xl font-black font-heading mt-0.5">
                {activeTab === "RESELLER_PREVIEW" ? "SolarKits Reseller Portal View" : "BOS Kits Distributor Console View"}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">Industry:</span>
              <select
                value={previewIndustryId}
                onChange={(e) => setPreviewIndustryId(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold"
              >
                {industries.map((ind) => (
                  <option key={ind._id || ind.id} value={ind._id || ind.id}>
                    {ind.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {previewItemsForIndustry.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-bold text-xs space-y-2">
              <FiImage size={32} className="mx-auto text-slate-600 mb-2" />
              <div>No active media published for {previewAudience} in this industry.</div>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs mt-2"
              >
                + Add Content for This Segment
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Hero Item */}
              {previewItemsForIndustry[0] && (
                <div className="relative rounded-2xl overflow-hidden aspect-[21/9] min-h-[260px] bg-slate-950 border border-slate-800 flex flex-col justify-end p-6">
                  {previewItemsForIndustry[0].media?.[0]?.thumbnail_url ? (
                    <img
                      src={previewItemsForIndustry[0].media[0].thumbnail_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                      style={{ objectPosition: previewItemsForIndustry[0].focal_position || "center" }}
                    />
                  ) : null}
                  <div className="relative z-10 space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase">
                      Featured Hero
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {previewItemsForIndustry[0].heading || previewItemsForIndustry[0].title}
                    </h3>
                    <p className="text-xs text-slate-300 max-w-lg line-clamp-2">
                      {previewItemsForIndustry[0].short_description}
                    </p>
                  </div>
                </div>
              )}

              {/* Gallery Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {previewItemsForIndustry.slice(1).map((item) => (
                  <div
                    key={item.id || item._id}
                    className="bg-slate-800/80 rounded-2xl overflow-hidden border border-slate-700/60 p-3 space-y-2"
                  >
                    <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative">
                      {item.media?.[0]?.thumbnail_url && (
                        <img
                          src={item.media[0].thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover"
                          style={{ objectPosition: item.focal_position || "center" }}
                        />
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[9px] font-bold uppercase">
                        {item.content_type}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-white line-clamp-1">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{item.short_description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: All Media Management / Drafts ───────────────────────────────── */}
      {(activeTab === "ALL_MEDIA" || activeTab === "DRAFTS") && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Search input */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <FiSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search media by title or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="">All Types</option>
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
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="">All Audiences</option>
                <option value="RESELLER">Resellers Only</option>
                <option value="DISTRIBUTOR">Distributors Only</option>
                <option value="BOTH">Both (Shared)</option>
              </select>

              {/* Industry Filter */}
              <select
                value={selectedIndustryFilter}
                onChange={(e) => setSelectedIndustryFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="">All Industries</option>
                {industries.map((ind) => (
                  <option key={ind._id || ind.id} value={ind._id || ind.id}>
                    {ind.name}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Switcher (Grid / Table) & Refresh */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode("GRID")}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === "GRID" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-xs font-bold" : "text-slate-500"
                    }`}
                  title="Grid View"
                >
                  <FiGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode("TABLE")}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === "TABLE" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-xs font-bold" : "text-slate-500"
                    }`}
                  title="List Table View"
                >
                  <FiList size={15} />
                </button>
              </div>

              <button
                onClick={fetchContents}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
                title="Reload Content"
              >
                <FiRefreshCw size={14} className={loading ? "animate-spin text-blue-600" : ""} />
              </button>
            </div>
          </div>

          {/* Bulk Action Toolbar (Appears when items are selected) */}
          {selectedIds.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-black text-blue-900 dark:text-blue-200">
                <FiCheckSquare size={16} />
                <span>{selectedIds.length} media items selected</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction("publish")}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Publish All
                </button>
                <button
                  onClick={() => handleBulkAction("pause")}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Pause All
                </button>
                <button
                  onClick={() => handleBulkAction("archive")}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Archive
                </button>
                <button
                  onClick={() => handleBulkAction("delete")}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* ── Content Grid View ──────────────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 animate-pulse space-y-3"
                >
                  <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                </div>
              ))}
            </div>
          ) : contentList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <FiImage size={28} />
              </div>
              <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                No Media Content Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Try adjusting your search filters, or click the button below to upload your first visual asset.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-2xl bg-[#185ADB] text-white text-xs font-black shadow-md cursor-pointer"
              >
                + Add First Media Asset
              </button>
            </div>
          ) : viewMode === "GRID" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {contentList.map((item) => {
                const id = item.id || item._id;
                const isSelected = selectedIds.includes(id);
                const thumb = item.media?.[0]?.thumbnail_url || item.media?.[0]?.url || item.thumbnail_url;
                const isVideo = item.content_type === "VIDEO" || item.content_type === "EXPLAINER_VIDEO";

                return (
                  <div
                    key={id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border transition-all duration-200 flex flex-col justify-between group ${isSelected
                      ? "border-[#185ADB] shadow-md ring-2 ring-[#185ADB]/20"
                      : "border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md"
                      }`}
                  >
                    {/* Media Thumbnail & Selection */}
                    <div className="relative aspect-video bg-slate-950 overflow-hidden">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          style={{ objectPosition: item.focal_position || "center" }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                          <FiImage size={28} />
                          <span className="text-[10px] font-bold mt-1">No Media Attached</span>
                        </div>
                      )}

                      {/* Dark overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                      {/* Checkbox selector */}
                      <button
                        onClick={() => handleSelectRow(id)}
                        className="absolute top-3 left-3 z-10 w-6 h-6 rounded-lg bg-black/60 backdrop-blur-md text-white flex items-center justify-center cursor-pointer border border-white/20"
                      >
                        {isSelected ? <FiCheckSquare size={14} className="text-blue-400" /> : <FiSquare size={14} />}
                      </button>

                      {/* Status badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <ContentStatusBadge status={item.status} />
                      </div>

                      {/* Center play icon for video */}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white">
                            <FiPlay size={16} className="ml-0.5 fill-white" />
                          </div>
                        </div>
                      )}

                      {/* Bottom meta tags */}
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md uppercase tracking-wider">
                          {item.content_type}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-600/80 backdrop-blur-md uppercase tracking-wider">
                          {item.target_audience}
                        </span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h4>
                        {item.heading && (
                          <p className="text-xs font-bold text-blue-600 line-clamp-1">
                            {item.heading}
                          </p>
                        )}
                        {item.short_description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {item.short_description}
                          </p>
                        )}
                      </div>

                      {/* Actions Toolbar */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                        {/* Active Toggle Switch */}
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-xl cursor-pointer transition-all ${item.is_active
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          title="Toggle Active Status"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${item.is_active ? "bg-emerald-600" : "bg-slate-400"
                              }`}
                          />
                          <span>{item.is_active ? "Active" : "Paused"}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDuplicate(item)}
                            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Duplicate Content"
                          >
                            <FiCopy size={13} />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                            title="Edit Content (Wizard)"
                          >
                            <FiEdit2 size={13} />
                          </button>

                          {item.status === "PUBLISHED" ? (
                            <button
                              onClick={() => handleUnpublish(id)}
                              className="p-1.5 rounded-xl hover:bg-amber-50 text-amber-600 transition-colors cursor-pointer"
                              title="Unpublish to Draft"
                            >
                              <FiPause size={13} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(id)}
                              className="p-1.5 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer"
                              title="Publish Live"
                            >
                              <FiCheck size={13} />
                            </button>
                          )}

                          <button
                            onClick={() => handleArchive(id)}
                            className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                            title="Archive / Delete"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs font-medium">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === contentList.length && contentList.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="p-4">Visual Asset</th>
                    <th className="p-4">Content Type</th>
                    <th className="p-4">Target Audience</th>
                    <th className="p-4">Placement</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {contentList.map((item) => {
                    const id = item.id || item._id;
                    const isSelected = selectedIds.includes(id);
                    const thumb = item.media?.[0]?.thumbnail_url || item.thumbnail_url;

                    return (
                      <tr
                        key={id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${isSelected ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                          }`}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-9 rounded-xl bg-slate-900 overflow-hidden shrink-0">
                              {thumb && <img src={thumb} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                              <div className="text-[10px] text-slate-400">{item.heading || "No headline"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-bold uppercase text-[10px] text-slate-600">
                          {item.content_type}
                        </td>
                        <td className="p-4 font-bold uppercase text-[10px] text-blue-600">
                          {item.target_audience}
                        </td>
                        <td className="p-4 text-slate-500 font-bold text-[11px]">
                          {item.placement}
                        </td>
                        <td className="p-4">
                          <ContentStatusBadge status={item.status} />
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                              title="Edit"
                            >
                              <FiEdit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDuplicate(item)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                              title="Duplicate"
                            >
                              <FiCopy size={13} />
                            </button>
                            <button
                              onClick={() => handleArchive(id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                              title="Delete"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 3-Step Media Creation / Edit Modal Wizard ───────────────────────── */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-8 max-h-[90vh]">
            {/* Wizard Header */}
            <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#185ADB]">
                  {editingContent ? "EDIT MEDIA ASSET" : "NEW MEDIA CREATOR"}
                </span>
                <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white">
                  {editingContent ? `Editing: ${editingContent.title}` : "Create Industry Showcase Media"}
                </h3>
              </div>

              {/* Wizard Steps Indicator */}
              <div className="flex items-center gap-2">
                {[
                  { num: 1, label: "Details & Copy" },
                  { num: 2, label: "Targeting & CTAs" },
                  { num: 3, label: "Assets & Settings" },
                ].map((s) => (
                  <button
                    key={s.num}
                    onClick={() => setFormStep(s.num)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all ${formStep === s.num
                      ? "bg-[#185ADB] text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700"
                      }`}
                  >
                    <span>{s.num}.</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                ))}

                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 ml-2"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Wizard Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* ── STEP 1: Content & Copy ─────────────────────────────────── */}
              {formStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                        Content Title (Admin Reference) *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Commercial Factory Rooftop 4K Video"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                        Content Type *
                      </label>
                      <select
                        value={contentType}
                        onChange={(e) => setContentType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                      >
                        {CONTENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                        Placement *
                      </label>
                      <select
                        value={placement}
                        onChange={(e) => setPlacement(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                      >
                        {PLACEMENTS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                        Display Priority (Higher shows first)
                      </label>
                      <input
                        type="number"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                      Customer Headline (6–9 Words Recommended)
                    </label>
                    <input
                      type="text"
                      value={heading}
                      onChange={(e) => setHeading(e.target.value)}
                      placeholder="e.g. Industrial & Factory Solar Power Systems"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                        Short Description / Caption
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">
                        {shortDescription.length} / 160 chars
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="e.g. High-yield commercial bifacial panels engineered for factory rooftops with zero export control."
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* ── STEP 2: Targeting & CTAs ────────────────────────────────── */}
              {formStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                      Target Audience *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: "RESELLER", label: "Resellers Only", desc: "SolarKits Reseller App" },
                        { key: "DISTRIBUTOR", label: "Distributors Only", desc: "BOS Kits Console" },
                        { key: "BOTH", label: "Both (Shared)", desc: "Show in both portals" },
                      ].map((aud) => (
                        <button
                          key={aud.key}
                          type="button"
                          onClick={() => setTargetAudience(aud.key)}
                          className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${targetAudience === aud.key
                            ? "border-[#185ADB] bg-blue-50/50 dark:bg-blue-950/40 text-[#185ADB]"
                            : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                        >
                          <div className="text-xs font-black">{aud.label}</div>
                          <div className="text-[10px] text-slate-500">{aud.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Industry Mappings */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                        Mapped Industry Segments
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setAssignedIndustryIds(
                            assignedIndustryIds.length === industries.length
                              ? []
                              : industries.map((i) => i._id || i.id)
                          )
                        }
                        className="text-[10px] font-bold text-[#185ADB] hover:underline"
                      >
                        {assignedIndustryIds.length === industries.length ? "Clear All" : "Select All"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                      {industries.map((ind) => {
                        const id = ind._id || ind.id;
                        const isChecked = assignedIndustryIds.includes(id);
                        return (
                          <label
                            key={id}
                            className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setAssignedIndustryIds((prev) =>
                                  prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                                )
                              }
                              className="rounded text-[#185ADB]"
                            />
                            <span>{ind.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Role Specific CTAs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="text-[10px] font-black uppercase text-blue-600">
                        Reseller CTA Settings
                      </span>
                      <input
                        type="text"
                        placeholder="CTA Label (e.g. View Solar Kit →)"
                        value={resellerCtaLabel}
                        onChange={(e) => setResellerCtaLabel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="CTA URL (e.g. /catalog)"
                        value={resellerCtaUrl}
                        onChange={(e) => setResellerCtaUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="text-[10px] font-black uppercase text-[#0575B8]">
                        Distributor CTA Settings
                      </span>
                      <input
                        type="text"
                        placeholder="CTA Label (e.g. View BOS Kit →)"
                        value={distributorCtaLabel}
                        onChange={(e) => setDistributorCtaLabel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="CTA URL (e.g. /distributor/portal/procure)"
                        value={distributorCtaUrl}
                        onChange={(e) => setDistributorCtaUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Media Assets & Settings ────────────────────────── */}
              {formStep === 3 && (
                <div className="space-y-6">
                  {/* Permissions & Focal Points */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                        Image/Video Focal Point
                      </label>
                      <select
                        value={focalPosition}
                        onChange={(e) => setFocalPosition(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                      >
                        {FOCAL_POINTS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col justify-end space-y-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                          className="rounded text-[#185ADB]"
                        />
                        <span>★ Mark as Featured Item</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowDownload}
                          onChange={(e) => setAllowDownload(e.target.checked)}
                          className="rounded text-[#185ADB]"
                        />
                        <span>Allow Partner Downloads</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowShare}
                          onChange={(e) => setAllowShare(e.target.checked)}
                          className="rounded text-[#185ADB]"
                        />
                        <span>Allow Partner Share Link</span>
                      </label>
                    </div>
                  </div>

                  {/* Upload Zone */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                      Media Upload / Video URL
                    </label>
                    <MediaUploadZone
                      mediaList={activeMediaList}
                      onUploadFile={handleUploadFile}
                      onUploadExternalUrl={handleUploadExternalUrl}
                      onDeleteMedia={handleDeleteMedia}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Navigation Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              {formStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setFormStep((s) => s - 1)}
                  className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                >
                  ← Previous Step
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {formStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setFormStep((s) => s + 1)}
                    className="px-5 py-2 rounded-2xl bg-[#185ADB] text-white text-xs font-black cursor-pointer shadow-md"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveContent}
                    disabled={saving}
                    className="px-6 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    {saving ? "Saving..." : "Save & Publish Media"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
