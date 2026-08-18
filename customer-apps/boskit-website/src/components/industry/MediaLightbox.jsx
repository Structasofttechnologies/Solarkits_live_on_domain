/**
 * MediaLightbox.jsx
 *
 * Immersive Full-Screen Lightbox for BOS Kits Distributor.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiZoomIn,
  FiZoomOut,
  FiRotateCcw,
  FiDownload,
  FiShare2,
  FiInfo,
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiArrowRight,
  FiCheck,
} from 'react-icons/fi';

function is_youtube(url) {
  return url && /youtube\.com|youtu\.be/.test(url);
}

function is_vimeo(url) {
  return url && /vimeo\.com/.test(url);
}

function youtube_embed(url) {
  const match = url?.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1` : url;
}

function vimeo_embed(url) {
  const match = url?.match(/vimeo\.com\/(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}?autoplay=1` : url;
}

function format_time(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MediaLightbox({
  isOpen = false,
  items = [],
  currentIndex = 0,
  onClose,
  onIndexChange,
  role = 'DISTRIBUTOR',
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showInfo, setShowInfo] = useState(true);
  const [copied, setCopied] = useState(false);

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const currentItem = items[currentIndex] || null;

  useEffect(() => {
    setZoomLevel(1);
    setIsPlaying(true);
    setCurrentTime(0);
  }, [currentIndex]);

  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose && onClose();
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < items.length - 1) onIndexChange && onIndexChange(currentIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) onIndexChange && onIndexChange(currentIndex - 1);
      } else if (e.key === ' ' && videoRef.current) {
        e.preventDefault();
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
      }
    },
    [isOpen, currentIndex, items.length, onClose, onIndexChange, isPlaying]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !currentItem) return null;

  const {
    title,
    heading,
    short_description,
    content_type,
    media = [],
    cta_label,
    cta_url,
    distributor_cta_label,
    distributor_cta_url,
    allow_download = true,
    allow_share = true,
    video_url,
    industries = [],
  } = currentItem;

  const videoMedia = media.find((m) => m.media_type === 'VIDEO');
  const imageMedia = media.find((m) => m.media_type === 'IMAGE' || m.media_type === 'PHOTO');
  const posterMedia = media.find((m) => m.media_type === 'POSTER' || m.media_type === 'THUMBNAIL');
  const primaryMedia = media.find((m) => m.is_primary) || videoMedia || posterMedia || imageMedia || media[0];

  const activeVideoUrl = video_url || videoMedia?.url || null;
  const isVideo = Boolean(activeVideoUrl || content_type === 'VIDEO' || content_type === 'EXPLAINER_VIDEO' || content_type === 'VIDEO_SLIDER');
  const isEmbed = isVideo && (is_youtube(activeVideoUrl) || is_vimeo(activeVideoUrl));
  const embedUrl = is_youtube(activeVideoUrl) ? youtube_embed(activeVideoUrl) : is_vimeo(activeVideoUrl) ? vimeo_embed(activeVideoUrl) : null;

  const imageSrc =
    primaryMedia?.url ||
    primaryMedia?.poster_url ||
    imageMedia?.url ||
    posterMedia?.url ||
    'https://images.unsplash.com/photo-1545208942-e1c9c916524b?q=80&w=1600&auto=format&fit=crop';

  const resolvedCtaLabel = distributor_cta_label || cta_label || 'View BOS Kit';
  const resolvedCtaUrl = distributor_cta_url || cta_url || '/distributor/portal/procure';
  const displayHeading = heading || title || 'BOS Hardware Solution';

  const handlePrev = () => {
    if (currentIndex > 0) onIndexChange && onIndexChange(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) onIndexChange && onIndexChange(currentIndex + 1);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const newTime = Number(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = isVideo && activeVideoUrl ? activeVideoUrl : imageSrc;
    link.download = `${title || 'bos-asset'}.${isVideo ? 'mp4' : 'jpg'}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col justify-between bg-black/95 backdrop-blur-xl animate-in fade-in duration-200 select-none text-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={displayHeading}
    >
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/90 to-transparent z-40">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-white/10 text-white/90">
            {currentIndex + 1} / {items.length}
          </span>
          <div className="hidden sm:block">
            <h2 className="text-sm font-black truncate max-w-md text-white font-heading">
              {displayHeading}
            </h2>
            {industries[0]?.name && (
              <span className="text-[10px] uppercase font-bold text-[#0575B8]">
                {industries[0].name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isVideo && (
            <div className="hidden sm:flex items-center bg-white/10 rounded-2xl p-1 gap-1 border border-white/10">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                className="p-1.5 rounded-xl hover:bg-white/20 transition-colors text-white cursor-pointer"
                title="Zoom In"
              >
                <FiZoomIn size={15} />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                className="p-1.5 rounded-xl hover:bg-white/20 transition-colors text-white cursor-pointer"
                title="Zoom Out"
              >
                <FiZoomOut size={15} />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 rounded-xl hover:bg-white/20 transition-colors text-white cursor-pointer"
                title="Reset Zoom"
              >
                <FiRotateCcw size={14} />
              </button>
            </div>
          )}

          {allow_download && (
            <button
              onClick={handleDownload}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Download Media File"
            >
              <FiDownload size={16} />
            </button>
          )}

          {allow_share && (
            <button
              onClick={handleShare}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer relative"
              title="Share Link"
            >
              {copied ? <FiCheck size={16} className="text-emerald-400" /> : <FiShare2 size={16} />}
            </button>
          )}

          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-2xl transition-colors cursor-pointer ${
              showInfo ? 'bg-[#0575B8] text-white' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title="Toggle Details Drawer"
          >
            <FiInfo size={16} />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/15 hover:bg-red-600 text-white transition-all cursor-pointer hover:rotate-90"
            title="Close Viewer (Esc)"
          >
            <FiX size={18} />
          </button>
        </div>
      </div>

      {/* ── Canvas View ────────────────────────────────────────────────────── */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-6">
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all hover:scale-110 shadow-2xl cursor-pointer"
            aria-label="Previous Media"
          >
            <FiChevronLeft size={24} />
          </button>
        )}

        {currentIndex < items.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all hover:scale-110 shadow-2xl cursor-pointer"
            aria-label="Next Media"
          >
            <FiChevronRight size={24} />
          </button>
        )}

        <div className="relative max-w-6xl max-h-[75vh] w-full h-full flex items-center justify-center">
          {isVideo ? (
            isEmbed ? (
              <iframe
                src={embedUrl}
                title={displayHeading}
                className="w-full h-full min-h-[340px] sm:min-h-[500px] rounded-2xl border-0 shadow-2xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center group">
                <video
                  ref={videoRef}
                  src={activeVideoUrl}
                  poster={imageSrc}
                  autoPlay
                  playsInline
                  onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                  onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                  onEnded={() => setIsPlaying(false)}
                  className="max-h-[70vh] max-w-full rounded-2xl shadow-2xl object-contain cursor-pointer"
                  onClick={togglePlay}
                />

                <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-2xl">
                  <button
                    onClick={togglePlay}
                    className="p-1.5 rounded-xl bg-white text-slate-900 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    {isPlaying ? <FiPause size={14} /> : <FiPlay size={14} className="ml-0.5" />}
                  </button>

                  <span className="text-[11px] font-mono font-bold text-white/90">
                    {format_time(currentTime)} / {format_time(duration)}
                  </span>

                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 accent-blue-500 h-1.5 bg-white/20 rounded-lg cursor-pointer"
                  />

                  <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors cursor-pointer">
                    {isMuted ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
                  </button>

                  <button
                    onClick={() => {
                      if (videoRef.current?.requestFullscreen) videoRef.current.requestFullscreen();
                    }}
                    className="text-white hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <FiMaximize size={16} />
                  </button>
                </div>
              </div>
            )
          ) : (
            <div
              className="overflow-hidden flex items-center justify-center transition-transform duration-300 ease-out"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={imageSrc}
                alt={displayHeading}
                className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl object-contain"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Strip ────────────────────────────────────────────────────── */}
      <div className="bg-black/90 backdrop-blur-xl border-t border-white/10 p-3 sm:p-4 z-40 space-y-3">
        {showInfo && (
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/5">
            <div className="space-y-0.5 max-w-2xl">
              <h3 className="font-heading font-black text-sm text-white">
                {displayHeading}
              </h3>
              {short_description && (
                <p className="text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed">
                  {short_description}
                </p>
              )}
            </div>

            {resolvedCtaUrl && (
              <a
                href={resolvedCtaUrl}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-black hover:bg-blue-50 transition-all shadow-md active:scale-95"
              >
                <span>{resolvedCtaLabel}</span>
                <FiArrowRight size={13} />
              </a>
            )}
          </div>
        )}

        {items.length > 1 && (
          <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {items.map((item, idx) => {
              const isSelected = idx === currentIndex;
              const thumbMedia = item.media?.find((m) => m.thumbnail_url || m.poster_url || m.url) || item.media?.[0];
              const thumbUrl = thumbMedia?.thumbnail_url || thumbMedia?.poster_url || thumbMedia?.url || null;

              return (
                <button
                  key={item.id || item._id || idx}
                  onClick={() => onIndexChange && onIndexChange(idx)}
                  className={`
                    shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-slate-900
                    ${isSelected ? 'border-[#0575B8] scale-105 shadow-md shadow-blue-500/30' : 'border-white/20 opacity-60 hover:opacity-100'}
                  `}
                >
                  {thumbUrl ? (
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/50">
                      {idx + 1}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
