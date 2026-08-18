import React from 'react';
import { FiImage } from 'react-icons/fi';

export default function ContentEmptyState({
  icon: Icon = FiImage,
  title = 'No Media Found',
  message = 'Content will appear once published by Admin.',
  compact = false,
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl text-center border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center ${
        compact ? 'p-6' : 'p-10'
      }`}
    >
      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#0575B8] flex items-center justify-center mb-3">
        <Icon size={24} />
      </div>
      <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
        {title}
      </h4>
      <p className="text-xs text-slate-500 max-w-sm font-medium mt-1">
        {message}
      </p>
    </div>
  );
}
