import React, { useState } from 'react';
import { FiX, FiTruck, FiFileText, FiPhone, FiZap } from 'react-icons/fi';

const ANNOUNCEMENTS = [
  { icon: FiFileText, text: 'GST Invoice on every order — 100% ITC eligible' },
  { icon: FiTruck, text: 'Pan-India delivery from centralized warehouse hubs' },
  { icon: FiZap, text: 'Tier-1 Inverters, TOPCon Panels & BOS Kits — factory pricing' },
  { icon: FiPhone, text: 'Bulk quote assistance: Call +91-800-SOLAR-KIT' },
];

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  const [current, setCurrent] = useState(0);

  if (dismissed) return null;

  return (
    <div className="bg-[#1F8F4E] text-white text-xs font-medium relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-9 gap-4">
          {/* Desktop: show multiple */}
          <div className="hidden md:flex items-center justify-center gap-8 flex-1">
            {ANNOUNCEMENTS.slice(0, 3).map((item, i) => {
              const Icon = item.icon;
              return (
                <span key={i} className="flex items-center gap-1.5 whitespace-nowrap opacity-95">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {item.text}
                </span>
              );
            })}
          </div>
          {/* Mobile: single message */}
          <div className="md:hidden flex items-center gap-1.5 flex-1 justify-center">
            {(() => {
              const Icon = ANNOUNCEMENTS[current].icon;
              return (
                <>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{ANNOUNCEMENTS[current].text}</span>
                </>
              );
            })()}
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity p-1 rounded"
            aria-label="Dismiss announcement"
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
