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
    color: '#0575B8',
    bg: '#EFF8FF',
    border: '#BAE6FD',
    path: '/products?cat=inverters',
  },
  {
    id: 'panels',
    name: 'Solar Panels',
    description: 'TOPCon, PERC & bifacial modules',
    icon: MdSolarPower,
    color: '#0575B8',
    bg: '#EFF8FF',
    border: '#BAE6FD',
    path: '/products?cat=panels',
  },
  {
    id: 'structures',
    name: 'Mounting Structures',
    description: 'Rooftop & ground mount systems',
    icon: FiGrid,
    color: '#0575B8',
    bg: '#EFF8FF',
    border: '#BAE6FD',
    path: '/products?cat=structures',
  },
  {
    id: 'dcdb',
    name: 'DCDB & ACDB',
    description: 'Protection & switchgear boxes',
    icon: FiBox,
    color: '#0575B8',
    bg: '#EFF8FF',
    border: '#BAE6FD',
    path: '/products?cat=dcdb',
  },
  {
    id: 'cables',
    name: 'DC Cables & Connectors',
    description: 'MC4, DC wire & string cables',
    icon: FiRadio,
    color: '#0575B8',
    bg: '#EFF8FF',
    border: '#BAE6FD',
    path: '/products?cat=cables',
  },
  {
    id: 'bos-kits',
    name: 'BOS Combo Kits',
    description: 'Pre-engineered balance-of-system kits',
    icon: FiLayers,
    color: '#F49222',
    bg: '#FFF7ED',
    border: '#FED7AA',
    path: '/products?cat=bos-kits',
  },
];

export default function CategoryGrid({ title = 'Shop by Category', subtitle = null }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-[#0575B8] uppercase tracking-widest bg-[#EFF8FF] px-3 py-1 rounded-full border border-[#BAE6FD]">
            Browse
          </span>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#0F172A] tracking-tight mt-2">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-[#475569] mt-1">{subtitle}</p>}
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0575B8] hover:text-[#045D93] group shrink-0"
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
              className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl border bg-white hover:shadow-lg hover:border-[#0575B8]/40 transition-all duration-200 text-center"
              style={{ borderColor: cat.border }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-2xs"
                style={{ background: cat.bg, color: cat.color }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#0F172A] leading-snug group-hover:text-[#0575B8] transition-colors">
                  {cat.name}
                </p>
                <p className="text-[10px] text-[#64748B] mt-0.5 hidden sm:block leading-tight">
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
