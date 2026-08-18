import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiZap, FiShield, FiLock, FiSliders } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

// Reliable high-resolution solar equipment fallbacks for each category
const FALLBACK_IMAGES = {
  panels: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
  inverters: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80',
  structures: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=800&q=80',
  dcdb: 'https://images.unsplash.com/photo-1558441719-53e34b9d311d?auto=format&fit=crop&w=800&q=80',
  cables: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b6?auto=format&fit=crop&w=800&q=80',
  'bos-kits': 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
};

function getFallback(category, name = '') {
  const cat = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (cat.includes('panel') || n.includes('panel') || n.includes('module') || n.includes('perc') || n.includes('topcon')) {
    return FALLBACK_IMAGES.panels;
  }
  if (cat.includes('inverter') || n.includes('inverter') || n.includes('growatt') || n.includes('havells')) {
    return FALLBACK_IMAGES.inverters;
  }
  if (cat.includes('structure') || n.includes('structure') || n.includes('mount')) {
    return FALLBACK_IMAGES.structures;
  }
  if (cat.includes('battery') || n.includes('battery') || n.includes('lfp') || cat.includes('dcdb')) {
    return FALLBACK_IMAGES.dcdb;
  }
  if (cat.includes('cable') || n.includes('cable') || n.includes('mc4')) {
    return FALLBACK_IMAGES.cables;
  }
  return FALLBACK_IMAGES.default;
}

/**
 * B2B Equipment Showcase Card for boskit-website.
 * Public visitors view product specs & brand portfolio.
 * Ordering/procuring takes place in the Distributor Portal after partner registration.
 */
export default function ProductCard({ product }) {
  const {
    id,
    _id,
    name = 'Solar Equipment',
    brand,
    category,
    image_url,
    mrp,
    price_inr,
    badge,
    short_spec,
    specifications,
    moq,
    sku,
  } = product || {};

  const productId = id || _id;
  const { role, isAuthenticated } = useAuth();
  const fallbackImg = getFallback(category, name);
  const [imgSrc, setImgSrc] = useState(image_url || fallbackImg);
  const [hasImgError, setHasImgError] = useState(false);

  // Derive specs
  const specSnippet =
    short_spec ||
    (specifications
      ? Object.entries(specifications)
          .slice(0, 2)
          .map(([k, v]) => `${v}`)
          .join(' · ')
      : null);

  const rawMrp = mrp || price_inr || 9999;
  const distBuyRate = Math.round(rawMrp * 0.85);

  return (
    <div className="group bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:border-[#0575B8]/50 transition-all duration-300 flex flex-col justify-between">
      
      {/* Product Image Showcase */}
      <div>
        <Link to={`/products/${productId}`} className="block relative aspect-[4/3] bg-[#F8FAFC] overflow-hidden border-b border-[#E2E8F0]">
          <img
            src={hasImgError ? fallbackImg : imgSrc}
            alt={name}
            loading="lazy"
            onError={() => {
              if (!hasImgError) {
                setHasImgError(true);
                setImgSrc(fallbackImg);
              }
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {badge ? (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-[#F49222] text-white shadow-xs">
                {badge}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-[#0575B8] text-white shadow-xs">
                Tier-1 Certified
              </span>
            )}
          </div>

          <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#475569] border border-[#E2E8F0] shadow-xs z-10">
            MOQ: {moq || 1} {moq > 1 ? 'Units' : 'Unit'}
          </span>
        </Link>

        {/* Content */}
        <div className="p-5 space-y-2.5">
          {/* Brand + SKU */}
          <div className="flex items-center justify-between text-xs text-[#475569]">
            <span className="font-bold text-[#0575B8] bg-[#EFF8FF] px-2 py-0.5 rounded border border-[#BAE6FD]">
              {brand || 'SolarKits Pro'}
            </span>
            {sku && <span className="font-mono text-[11px] text-[#64748B]">SKU: {sku}</span>}
          </div>

          {/* Title */}
          <Link to={`/products/${productId}`}>
            <h3 className="font-heading font-bold text-base text-[#0F172A] leading-snug group-hover:text-[#0575B8] transition-colors line-clamp-2">
              {name}
            </h3>
          </Link>

          {/* Specifications Preview */}
          {specSnippet && (
            <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed">
              {specSnippet}
            </p>
          )}
        </div>
      </div>

      {/* Footer / Partner Access CTA */}
      <div className="p-5 pt-0 space-y-3">
        {/* Pricing Info */}
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
          {role === 'distributor' ? (
            <div>
              <span className="text-[10px] text-[#64748B] line-through block">
                MRP: ₹{rawMrp.toLocaleString('en-IN')}
              </span>
              <span className="text-sm font-extrabold text-[#0575B8] font-heading">
                ₹{distBuyRate.toLocaleString('en-IN')}
              </span>
              <span className="text-[9px] text-[#64748B] font-semibold block">Factory Buy Rate</span>
            </div>
          ) : (
            <div>
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-medium">Standard MRP</span>
              <span className="text-sm font-bold text-[#0F172A]">
                ₹{rawMrp.toLocaleString('en-IN')}
              </span>
            </div>
          )}

          <div className="text-right">
            {role === 'distributor' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0575B8] bg-[#EFF8FF] px-2 py-1 rounded-md border border-[#BAE6FD]">
                <FiSliders className="w-3 h-3" /> Partner Rate
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0575B8] bg-[#EFF8FF] px-2 py-1 rounded-md border border-[#BAE6FD]">
                <FiLock className="w-3 h-3 text-[#F49222]" /> Wholesale Rate
              </span>
            )}
          </div>
        </div>

        {/* Primary Action */}
        {role === 'distributor' ? (
          <Link
            to="/distributor/portal/procure"
            className="w-full py-2.5 rounded-xl text-center text-xs font-bold bg-[#0575B8] text-white hover:bg-[#045D93] shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <FiSliders className="w-3.5 h-3.5" /> Procure in Partner Console
          </Link>
        ) : (
          <Link
            to={`/products/${productId}`}
            className="w-full py-2.5 rounded-xl text-center text-xs font-bold bg-[#FFFFFF] hover:bg-[#EFF8FF] text-[#0575B8] border border-[#E2E8F0] hover:border-[#0575B8]/50 flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <FiEye className="w-3.5 h-3.5" /> View Specifications & Access
          </Link>
        )}
      </div>

    </div>
  );
}
