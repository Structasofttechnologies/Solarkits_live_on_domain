import React from "react";
import { FiTruck, FiFileText, FiPhoneCall, FiCheckCircle } from "react-icons/fi";

export default function AnnouncementBar({ onOpenExpertHelp }) {
  return (
    <div className="bg-gradient-to-r from-sky-50 via-white to-amber-50/60 text-slate-700 text-xs border-b border-slate-200/80 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Left: Value propositions / claims */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center md:justify-start">
          <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <FiTruck className="text-secondary shrink-0" size={14} />
            <span>Pan-India Doorstep Delivery</span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-slate-700 font-semibold">
            <FiFileText className="text-primary shrink-0" size={14} />
            <span>GST Tax Invoices Included</span>
          </span>
          <span className="hidden lg:flex items-center gap-1.5 text-slate-700 font-semibold">
            <FiCheckCircle className="text-emerald-600 shrink-0" size={14} />
            <span>Certified Complete Solar Power Kits</span>
          </span>
        </div>

        {/* Right: Expert help link */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
          {onOpenExpertHelp && (
            <button
              onClick={onOpenExpertHelp}
              className="flex items-center gap-1 text-secondary hover:text-amber-600 font-bold transition-colors cursor-pointer bg-white px-3 py-1 rounded-full border border-amber-200/80 shadow-xs"
            >
              <FiPhoneCall size={12} />
              <span>Talk to a Solar Expert</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
