/**
 * MoreFromIndustryCarousel.jsx
 *
 * Compact Horizontal Carousel for BOS Kits & Components.
 */

import React, { useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiArrowRight, FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function MoreFromIndustryCarousel({
  title = 'More BOS Components for this Industry',
  products = [],
  industryName = 'Segment',
  role = 'DISTRIBUTOR',
}) {
  const scrollRef = useRef(null);

  if (!products || products.length === 0) return null;

  const handleScroll = (dir) => {
    if (!scrollRef.current) return;
    const distance = 300;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -distance : distance, behavior: 'smooth' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#0575B8] flex items-center justify-center">
            <span className="text-sm font-black">⚡</span>
          </div>
          <div>
            <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white">
              {title}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {industryName} Hardware & Mounting Specs
            </span>
          </div>
        </div>

        {/* Arrow Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleScroll('left')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            aria-label="Scroll left"
          >
            ←
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            aria-label="Scroll right"
          >
            →
          </button>
        </div>
      </div>

      {/* Horizontal Cards Rail */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin"
      >
        {products.map((item, idx) => {
          const thumb = item.thumbnail_url || item.primary_image || item.image || 'https://images.unsplash.com/photo-1545208942-e1c9c916524b?q=80&w=400';
          const price = item.b2b_price_inr || item.price_inr || item.mrp_inr;

          return (
            <Link
              key={item.id || item._id || idx}
              to="/distributor/portal/procure"
              className="shrink-0 w-56 sm:w-64 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-700/60 hover:border-[#0575B8] dark:hover:border-[#0575B8] hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-900 relative">
                  <img
                    src={thumb}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {item.category && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider">
                      {item.category}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-[#0575B8] uppercase tracking-wider block truncate">
                    {item.brand || 'BOS Kits Pro'}
                  </span>
                  <h4 className="font-heading font-black text-xs text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#0575B8] transition-colors">
                    {item.name}
                  </h4>
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                {price ? (
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    ₹{Number(price).toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-500">Distributor Rate</span>
                )}
                <span className="text-[11px] font-bold text-[#0575B8] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Procure →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
