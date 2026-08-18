import React from 'react';
import { Link } from 'react-router-dom';
import { FiZap, FiBox, FiLayers, FiGrid, FiRadio, FiSliders, FiArrowRight } from 'react-icons/fi';
import { MdSolarPower } from 'react-icons/md';

const CATEGORIES = [
  {
    id: 'inverters',
    name: 'Solar Inverters',
    description: 'String, hybrid & micro inverters',
    icon: FiZap,
    color: '#1F8F4E',
    bg: '#ECF8F1',
    border: '#DDE8E1',
    path: '/products?cat=inverters',
  },
  {
    id: 'panels',
    name: 'Solar Panels',
    description: 'TOPCon, PERC & bifacial modules',
    icon: MdSolarPower,
    color: '#1F8F4E',
    bg: '#ECF8F1',
    border: '#DDE8E1',
    path: '/products?cat=panels',
  },
  {
    id: 'structures',
    name: 'Mounting Structures',
    description: 'Rooftop & ground mount systems',
    icon: FiGrid,
    color: '#1F8F4E',
    bg: '#ECF8F1',
    border: '#DDE8E1',
    path: '/products?cat=structures',
  },
  {
    id: 'dcdb',
    name: 'DCDB & ACDB',
    description: 'Protection & switchgear boxes',
    icon: FiBox,
    color: '#1F8F4E',
    bg: '#ECF8F1',
    border: '#DDE8E1',
    path: '/products?cat=dcdb',
  },
  {
    id: 'cables',
    name: 'DC Cables & Connectors',
    description: 'MC4, DC wire & string cables',
    icon: FiRadio,
    color: '#1F8F4E',
    bg: '#ECF8F1',
    border: '#DDE8E1',
    path: '/products?cat=cables',
  },
  {
    id: 'bos-kits',
    name: 'BOS Combo Kits',
    description: 'Pre-engineered balance-of-system kits',
    icon: FiLayers,
    color: '#F5B700',
    bg: '#FEF9E7',
    border: '#F5B70040',
    path: '/products?cat=bos-kits',
  },
];

export default function CategoryGrid({ title = 'Shop by Category', subtitle = null }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest bg-[#ECF8F1] px-3 py-1 rounded-full border border-[#DDE8E1]">
            Browse
          </span>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#17211B] tracking-tight mt-2">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-[#5F6F65] mt-1">{subtitle}</p>}
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#1F8F4E] hover:text-[#18733E] group shrink-0"
        >
          View All Equipment <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.id}
              to={cat.path}
              className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl border bg-white hover:shadow-md transition-all duration-200 text-center"
              style={{ borderColor: cat.border }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: cat.bg, color: cat.color }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#17211B] leading-snug group-hover:text-[#1F8F4E] transition-colors">
                  {cat.name}
                </p>
                <p className="text-[10px] text-[#5F6F65] mt-0.5 hidden sm:block leading-tight">
                  {cat.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
