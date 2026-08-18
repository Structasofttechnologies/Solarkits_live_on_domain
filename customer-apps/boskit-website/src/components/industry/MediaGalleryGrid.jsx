/**
 * MediaGalleryGrid.jsx
 *
 * Editorial Responsive Media Grid for BOS Kits Distributor.
 */

import React from 'react';
import MediaCard from './MediaCard';
import { FiImage } from 'react-icons/fi';

export default function MediaGalleryGrid({
  items = [],
  onCardClick,
  onDownload,
  onShare,
  role = 'DISTRIBUTOR',
  emptyMessage = 'No distributor media assets available in this category.',
}) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#0575B8] mx-auto flex items-center justify-center">
          <FiImage size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
            No Media Found
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {items.map((item, index) => {
        const isFeaturedSpan = index === 0 && item.is_featured && items.length > 2;

        return (
          <div
            key={item.id || item._id || index}
            className={isFeaturedSpan ? 'sm:col-span-2' : ''}
          >
            <MediaCard
              item={item}
              onClick={onCardClick}
              onDownload={onDownload}
              onShare={onShare}
              role={role}
            />
          </div>
        );
      })}
    </div>
  );
}
