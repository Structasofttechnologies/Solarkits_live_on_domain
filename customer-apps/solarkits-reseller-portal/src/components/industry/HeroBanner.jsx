/**
 * HeroBanner.jsx
 *
 * Renders the highest-priority HERO_BANNER or VIDEO_SLIDER content item.
 * - Video: autoplay muted loop with poster image fallback
 * - Image: responsive (desktop/mobile variants)
 * - Animated gradient overlay, heading, description, CTA button
 */

import { useRef, useEffect, useState } from 'react';
import { FiArrowRight, FiPlay } from 'react-icons/fi';

function pick_media(media_arr = [], preferred_device = 'DESKTOP') {
  const byDevice = media_arr.filter(m => m.device_type === preferred_device || m.device_type === 'ALL');
  return (byDevice.find(m => m.is_primary) || byDevice[0] || media_arr[0] || null);
}

function pick_video(media_arr = []) {
  return media_arr.find(m => m.media_type === 'VIDEO');
}

function pick_poster(media_arr = []) {
  return media_arr.find(m => m.media_type === 'THUMBNAIL' || m.media_type === 'POSTER' || m.media_type === 'IMAGE');
}

export default function HeroBanner({ content, onCtaClick }) {
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!content) return null;

  const { media = [], heading, short_description, cta_label, cta_url,
          autoplay, muted, loop, show_controls } = content;

  const videoMedia = pick_video(media);
  const imageMedia = pick_media(media, isMobile ? 'MOBILE' : 'DESKTOP');
  const posterMedia = pick_poster(media);

  const bgUrl = (imageMedia && imageMedia.media_type !== 'VIDEO') ? imageMedia.url :
                posterMedia ? posterMedia.url : null;

  const showVideo = videoMedia && !videoError;

  const handleCta = () => {
    if (onCtaClick) onCtaClick(content);
    if (cta_url) {
      if (cta_url.startsWith('/')) window.location.href = cta_url;
      else window.open(cta_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden min-h-[260px] sm:min-h-[320px] shadow-lg">
      {/* Background media */}
      {showVideo ? (
        <video
          ref={videoRef}
          key={videoMedia.url}
          className="absolute inset-0 w-full h-full object-cover"
          src={videoMedia.url}
          autoPlay={autoplay !== false}
          muted={muted !== false}
          loop={loop !== false}
          playsInline
          controls={show_controls && !autoplay}
          poster={posterMedia?.url || bgUrl || undefined}
          onError={() => setVideoError(true)}
        />
      ) : bgUrl ? (
        <img
          src={bgUrl}
          alt={heading || 'Banner'}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        /* Gradient fallback */
        <div className="absolute inset-0" style={{ background: 'var(--gradient-primary)' }} />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col justify-end h-full p-6 sm:p-10 min-h-[260px] sm:min-h-[320px]">
        <div className="max-w-xl space-y-3">
          {heading && (
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-md">
              {heading}
            </h2>
          )}
          {short_description && (
            <p className="text-sm sm:text-base font-medium text-white/85 leading-relaxed max-w-lg">
              {short_description}
            </p>
          )}
          {cta_label && (
            <button
              onClick={handleCta}
              className="inline-flex items-center gap-2 px-5 py-2.5 mt-2 bg-white text-slate-900 font-bold rounded-2xl text-sm shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              {cta_label}
              <FiArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Video play icon hint (when not autoplaying) */}
      {showVideo && !autoplay && (
        <div className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
          <FiPlay size={18} className="text-white ml-0.5" />
        </div>
      )}
    </div>
  );
}
