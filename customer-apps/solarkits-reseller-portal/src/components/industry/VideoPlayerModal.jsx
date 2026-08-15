/**
 * VideoPlayerModal.jsx
 *
 * Accessible modal player for explainer videos.
 * Supports: Cloudinary uploads + external URLs (YouTube embed, Vimeo).
 * Closes on Escape key, backdrop click, or X button.
 */

import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { createPortal } from 'react-dom';

function is_youtube(url) {
  return url && /youtube\.com|youtu\.be/.test(url);
}

function is_vimeo(url) {
  return url && /vimeo\.com/.test(url);
}

function youtube_embed(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0` : url;
}

function vimeo_embed(url) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}?autoplay=1` : url;
}

export default function VideoPlayerModal({ video_url, title, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!video_url) return null;

  const isYT = is_youtube(video_url);
  const isVimeo = is_vimeo(video_url);
  const isEmbed = isYT || isVimeo;
  const embedUrl = isYT ? youtube_embed(video_url) : isVimeo ? vimeo_embed(video_url) : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Video player'}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-3xl bg-black rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/80">
          {title && <p className="text-white font-bold text-sm truncate">{title}</p>}
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close video"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Video */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {isEmbed ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={embedUrl}
              title={title || 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              className="absolute inset-0 w-full h-full"
              src={video_url}
              autoPlay
              controls
              playsInline
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
