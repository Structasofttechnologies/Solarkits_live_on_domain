import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiGrid,
  FiSearch,
  FiX,
  FiImage,
  FiVideo,
  FiPlay,
  FiChevronRight,
  FiAlertCircle,
  FiLayers,
  FiSun,
  FiZap,
  FiHome,
  FiBriefcase,
  FiFileText,
} from "react-icons/fi";
import { MdOutlineFactory, MdAgriculture, MdOutlineAccountBalance } from "react-icons/md";
import Navbar from "../landingPage/Navbar";
import Footer from "../landingPage/Footer";
import MediaLightbox from "../../Components/MediaLightbox";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE = rawApiUrl.replace(/\/api\/?$/, "");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const INDUSTRY_ICON_MAP = {
  residential: FiHome,
  commercial: FiBriefcase,
  industrial: MdOutlineFactory,
  agricultural: MdAgriculture,
  "solar farm": FiSun,
  hybrid: FiZap,
  government: MdOutlineAccountBalance,
};

function getIndustryIcon(name = "") {
  const lower = name.toLowerCase();
  for (const [key, Icon] of Object.entries(INDUSTRY_ICON_MAP)) {
    if (lower.includes(key)) return Icon;
  }
  return FiGrid;
}

const PALETTE = [
  { bg: "bg-amber-50 dark:bg-amber-900/20", icon: "text-amber-600 dark:text-amber-400", accent: "bg-amber-600", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  { bg: "bg-orange-50 dark:bg-orange-900/20", icon: "text-orange-600 dark:text-orange-400", accent: "bg-orange-600", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" },
  { bg: "bg-rose-50 dark:bg-rose-900/20", icon: "text-rose-600 dark:text-rose-400", accent: "bg-rose-600", badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300" },
  { bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "text-emerald-600 dark:text-emerald-400", accent: "bg-emerald-600", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
  { bg: "bg-blue-50 dark:bg-blue-900/20", icon: "text-blue-600 dark:text-blue-400", accent: "bg-blue-600", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  { bg: "bg-violet-50 dark:bg-violet-900/20", icon: "text-violet-600 dark:text-violet-400", accent: "bg-violet-600", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300" },
];
function getPalette(index) {
  return PALETTE[index % PALETTE.length];
}

// ─── Content Card ─────────────────────────────────────────────────────────────
function TenderContentCard({ item, palette, onOpen }) {
  const [imgErr, setImgErr] = useState(false);
  const primaryMedia = item.media?.find((m) => m.is_primary) || item.media?.[0];
  const thumb = !imgErr && (primaryMedia?.thumbnail_url || primaryMedia?.url || item.thumbnail);
  const isVideo =
    item.content_type === "VIDEO" ||
    item.content_type === "EXPLAINER_VIDEO" ||
    item.content_type === "VIDEO_SLIDER" ||
    Boolean(item.video_url) ||
    Boolean(item.media?.some((m) => m.media_type === "VIDEO"));
  const isSlider =
    item.content_type === "IMAGE_SLIDER" ||
    item.content_type === "GALLERY" ||
    (item.media && item.media.length > 1);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      onClick={onOpen}
      className="bg-surface rounded-2xl overflow-hidden border border-border shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col cursor-pointer"
    >
      <div className="relative aspect-video bg-slate-950 overflow-hidden shrink-0">
        {thumb ? (
          <img
            src={thumb}
            alt={item.title}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${palette.bg}`}>
            {isVideo ? <FiVideo size={28} className={palette.icon} /> : <FiImage size={28} className={palette.icon} />}
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">No Preview</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10 group-hover:from-black/85 transition-colors" />

        {/* Video Play Overlay */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-primary transition-all duration-300">
              <FiPlay size={20} className="text-white ml-0.5 fill-white" />
            </div>
            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <FiPlay size={10} className="fill-white" /> Play Video
            </span>
          </div>
        )}

        {/* Image Slider Badge */}
        {isSlider && !isVideo && (
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold flex items-center gap-1">
              <FiLayers size={10} />
              {item.media?.length > 1 ? `${item.media.length} Slides` : "Slider"}
            </span>
          </div>
        )}

        {/* Badges on Thumbnail */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider">
            {item.content_type?.replace(/_/g, " ")}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider">
            Govt Tender
          </span>
        </div>
        {item.is_featured && (
          <div className="absolute top-2.5 right-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black shadow-sm">
              ★ Featured
            </span>
          </div>
        )}
      </div>

      {/* Card Content - Text Low */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          <h3 className="text-xs sm:text-sm font-bold text-text-primary line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {item.heading || item.title}
          </h3>
          {item.short_description && (
            <p className="text-[11px] sm:text-xs text-text-secondary line-clamp-2 leading-relaxed">
              {item.short_description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-auto">
          {item.industries?.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {item.industries.slice(0, 2).map((ind) => (
                <span key={ind.id || ind._id} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${palette.badge}`}>
                  {ind.name}
                </span>
              ))}
            </div>
          ) : <div />}

          <span className="text-[11px] font-bold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0">
            {isVideo ? "Play Video" : isSlider ? "View Slides" : "View"}
            <FiChevronRight size={13} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BrowseByGovtTender() {
  const [industries, setIndustries] = useState([]);
  const [content, setContent] = useState([]);
  const [loadingIndustries, setLoadingIndustries] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIndustryId, setSelectedIndustryId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    document.title = "Browse SolarKits by Government Tender | SolarKits India";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE}/admin-api/industry-types/public/list`)
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setIndustries(Array.isArray(data) ? data.filter((i) => i.is_active !== false) : []);
      })
      .catch(() => setError("Failed to load categories."))
      .finally(() => setLoadingIndustries(false));
  }, []);

  const fetchContent = useCallback((industryId) => {
    setLoadingContent(true);
    const params = { content_category: "GOVT_TENDER", limit: 100 };
    if (industryId && industryId !== "all") params.industry_type_id = industryId;
    axios
      .get(`${API_BASE}/admin-api/industry-content/public/list`, { params })
      .then((res) => {
        const data = res.data?.data || [];
        setContent(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Failed to load tender content."))
      .finally(() => setLoadingContent(false));
  }, []);

  useEffect(() => { fetchContent(selectedIndustryId); }, [selectedIndustryId, fetchContent]);

  const displayedContent = content.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.heading?.toLowerCase().includes(q) ||
      item.short_description?.toLowerCase().includes(q) ||
      item.industries?.some((ind) => ind.name?.toLowerCase().includes(q))
    );
  });

  const activeIndustry = industries.find((i) => (i.id || i._id) === selectedIndustryId);

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col">
      <Navbar />

      {/* Hero — amber/orange government tender theme */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-amber-500 to-orange-600 dark:from-amber-950 dark:via-amber-900 dark:to-orange-900">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 25% 50%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <MdOutlineAccountBalance size={18} className="text-white" />
            </div>
            <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Government Procurement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-3">
            Browse SolarKits by Government Tender
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed">
            Explore solar kits and solutions specifically configured for government tenders, PSU procurement, MNRE schemes, and public sector projects across India.
          </p>
          {/* Info chips */}
          <div className="flex flex-wrap gap-2 mt-5">
            {["MNRE Approved", "GeM Portal Ready", "PSU Compliant", "Govt. Subsidy Eligible", "Pan-India Supply"].map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-[11px] font-bold border border-white/20">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* Sidebar */}
          <aside className="lg:w-64 xl:w-72 shrink-0">
            <div className="bg-surface rounded-2xl border border-border shadow-xs p-4 lg:sticky lg:top-24">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
                <FiFileText size={12} className="text-amber-500" />
                Filter by Sector
              </h2>
              <div className="relative mb-3">
                <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tender content..."
                  className="w-full pl-8 pr-8 py-2 bg-surface-hover border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    <FiX size={12} />
                  </button>
                )}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedIndustryId("all")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedIndustryId === "all" ? "bg-amber-500 text-white shadow-xs" : "text-text-secondary hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"}`}
                >
                  <FiGrid size={14} className={selectedIndustryId === "all" ? "text-white" : "text-amber-500"} />
                  <span>All Sectors</span>
                  <span className={`ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full ${selectedIndustryId === "all" ? "bg-white/20 text-white" : "bg-surface-hover text-text-muted"}`}>
                    {content.length}
                  </span>
                </button>
                {loadingIndustries ? (
                  [1, 2, 3, 4].map((i) => <div key={i} className="h-9 bg-surface-hover rounded-xl animate-pulse" />)
                ) : (
                  industries.map((industry, idx) => {
                    const Icon = getIndustryIcon(industry.name);
                    const palette = getPalette(idx);
                    const id = industry.id || industry._id;
                    const isActive = selectedIndustryId === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedIndustryId(id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive ? "bg-amber-500 text-white shadow-xs" : "text-text-secondary hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"}`}
                      >
                        <Icon size={14} className={isActive ? "text-white" : palette.icon} />
                        <span className="truncate text-left">{industry.name}</span>
                        <FiChevronRight size={12} className={`ml-auto shrink-0 ${isActive ? "text-white/60" : "text-text-muted"}`} />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base sm:text-lg font-black text-text-primary">
                  {selectedIndustryId === "all"
                    ? "All Government Tender Solar Content"
                    : `${activeIndustry?.name || "Sector"} — Tender Solar Solutions`}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {loadingContent ? "Loading..." : `${displayedContent.length} item${displayedContent.length !== 1 ? "s" : ""} found`}
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-danger-soft border border-danger/30 rounded-2xl mb-5">
                <FiAlertCircle size={18} className="text-danger shrink-0" />
                <p className="text-sm text-danger font-semibold">{error}</p>
              </div>
            )}

            {loadingContent ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-surface rounded-2xl overflow-hidden border border-border animate-pulse">
                    <div className="aspect-video bg-surface-hover" />
                    <div className="p-3.5 space-y-2">
                      <div className="h-3.5 w-3/4 bg-surface-hover rounded-lg" />
                      <div className="h-3 w-full bg-surface-hover rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedContent.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-border border-dashed p-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto">
                  <MdOutlineAccountBalance size={26} className="text-amber-500" />
                </div>
                <h3 className="font-bold text-sm text-text-primary">No Tender Content Yet</h3>
                <p className="text-xs text-text-muted max-w-xs mx-auto">
                  {selectedIndustryId === "all"
                    ? "No government tender content has been published yet."
                    : `No tender content published for ${activeIndustry?.name || "this sector"} yet.`}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {displayedContent.map((item, idx) => {
                    const firstIndustry = item.industries?.[0];
                    const industryIdx = industries.findIndex((i) => (i.id || i._id) === (firstIndustry?.id || firstIndustry?._id));
                    return (
                      <TenderContentCard
                        key={item.id || item._id}
                        item={item}
                        palette={getPalette(industryIdx >= 0 ? industryIdx : idx)}
                        onOpen={() => {
                          setLightboxIndex(idx);
                          setLightboxOpen(true);
                        }}
                      />
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </div>
      </div>

      <MediaLightbox
        isOpen={lightboxOpen}
        items={displayedContent}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />

      <Footer />
    </div>
  );
}
