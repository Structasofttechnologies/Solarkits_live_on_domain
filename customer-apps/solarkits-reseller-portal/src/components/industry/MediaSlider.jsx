/**
 * MediaSlider.jsx
 *
 * Swipeable media slider for IMAGE_SLIDER and VIDEO_SLIDER content items.
 * Features: arrow nav, dots, touch/swipe, keyboard, autoplay, pointer events.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function pick_primary_media(media_arr = []) {
  const image = media_arr.find(m => m.is_primary && m.media_type === 'IMAGE')
    || media_arr.find(m => m.media_type === 'IMAGE')
    || media_arr.find(m => m.media_type === 'THUMBNAIL');
  const video = media_arr.find(m => m.media_type === 'VIDEO');
  return { image, video };
}

function SlideItem({ item, isActive }) {
  const { media = [], heading, short_description, cta_label, cta_url } = item;
  const { image, video } = pick_primary_media(media);

  const handleCta = () => {
    if (!cta_url) return;
    if (cta_url.startsWith('/')) window.location.href = cta_url;
    else window.open(cta_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative w-full h-full min-h-[220px] sm:min-h-[280px] rounded-2xl overflow-hidden shrink-0">
      {/* Media */}
      {video && isActive ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={video.url}
          autoPlay
          muted
          loop
          playsInline
          poster={image?.url || undefined}
        />
      ) : image ? (
        <img
          src={image.url}
          alt={heading || 'Slide'}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: 'var(--gradient-primary)' }} />
      )}

      {/* Overlay */}
      {(heading || short_description || cta_label) && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            {heading && <p className="text-white font-black text-lg sm:text-xl leading-tight drop-shadow">{heading}</p>}
            {short_description && <p className="text-white/80 text-xs sm:text-sm mt-1 line-clamp-2">{short_description}</p>}
            {cta_label && (
              <button
                onClick={handleCta}
                className="mt-3 px-4 py-1.5 bg-white/90 text-slate-900 rounded-xl text-xs font-bold hover:bg-white transition-all cursor-pointer"
              >
                {cta_label} →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function MediaSlider({ items = [], autoPlayInterval = 5000 }) {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const timerRef = useRef(null);

  const total = items.length;

  const goTo = useCallback((index) => {
    setActive(((index % total) + total) % total);
  }, [total]);

  const prev = useCallback(() => goTo(active - 1), [active, goTo]);
  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  // Autoplay
  useEffect(() => {
    if (total <= 1) return;
    timerRef.current = setInterval(next, autoPlayInterval);
    return () => clearInterval(timerRef.current);
  }, [next, total, autoPlayInterval]);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, autoPlayInterval);
  };

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') { prev(); resetTimer(); }
      if (e.key === 'ArrowRight') { next(); resetTimer(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  // Touch / swipe
  const onTouchStart = (e) => { dragStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (dragStart.current === null) return;
    const delta = dragStart.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) { delta > 0 ? next() : prev(); resetTimer(); }
    dragStart.current = null;
  };

  if (!total) return null;

  return (
    <div className="relative w-full select-none group" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Slides */}
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {items.map((item, i) => (
            <div key={item.id || i} className="min-w-full">
              <SlideItem item={item} isActive={i === active} />
            </div>
          ))}
        </div>
      </div>

      {/* Arrow buttons */}
      {total > 1 && (
        <>
          <button
            onClick={() => { prev(); resetTimer(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 cursor-pointer"
            aria-label="Previous slide"
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            onClick={() => { next(); resetTimer(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 cursor-pointer"
            aria-label="Next slide"
          >
            <FiChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-20">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => { goTo(i); resetTimer(); }}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                i === active ? 'w-6 h-2 bg-white shadow-sm' : 'w-2 h-2 bg-white/50'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
