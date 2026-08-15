/**
 * IndustrySelector.jsx
 *
 * Horizontal scrollable chip row showing the reseller's approved industries.
 * Emits onSelect(industry) when clicked.
 * Auto-selects single industry on mount.
 */

import { FiChevronRight } from 'react-icons/fi';
import { MdFactory } from 'react-icons/md';

export default function IndustrySelector({ industries, selected, onSelect, loading }) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hover">
        {[1,2,3].map(i => (
          <div key={i} className="shrink-0 h-11 w-36 rounded-2xl bg-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!industries?.length) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
        <MdFactory size={18} />
        <span className="font-semibold">No industries assigned. Contact admin to get industry access.</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hover">
      {industries.map((industry) => {
        const isSelected = selected?.id === industry.id || selected?._id === industry._id;
        return (
          <button
            key={industry.id || industry._id}
            onClick={() => onSelect(industry)}
            className={`
              shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold
              transition-all duration-200 select-none cursor-pointer border
              ${isSelected
                ? 'bg-primary text-white border-primary shadow-md scale-105'
                : 'bg-white text-slate-700 border-slate-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary'
              }
            `}
            style={isSelected ? { background: 'var(--gradient-primary)' } : {}}
          >
            {industry.icon ? (
              <span className="text-base leading-none">{industry.icon}</span>
            ) : (
              <MdFactory size={16} className={isSelected ? 'text-white' : 'text-slate-400'} />
            )}
            <span>{industry.name}</span>
            {isSelected && <FiChevronRight size={14} className="opacity-80" />}
          </button>
        );
      })}
    </div>
  );
}
