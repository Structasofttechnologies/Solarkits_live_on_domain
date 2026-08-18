import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiCheckCircle, FiTruck,
  FiFileText, FiShield, FiPhone, FiBox, FiZap, FiLock, FiSliders, FiAward,
} from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const FALLBACK_IMAGES = {
  panels: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
  inverters: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80',
  structures: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=800&q=80',
  dcdb: 'https://images.unsplash.com/photo-1558441719-53e34b9d311d?auto=format&fit=crop&w=800&q=80',
  cables: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b6?auto=format&fit=crop&w=800&q=80',
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

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(null);
  const [hasImgError, setHasImgError] = useState(false);
  const { role, isAuthenticated } = useAuth();

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await api.get(`/public/products/${id}`);
        if (res.data?.product) {
          const prod = res.data.product;
          setProduct(prod);
          const fallback = getFallback(prod.category, prod.name);
          setImgSrc(prod.image_url || fallback);
        }
      } catch (err) {
        console.error('Error loading product detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-6">
        <div className="h-4 bg-[#E2E8F0] rounded animate-pulse w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] h-96 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            {[1,2,3,4].map(n => <div key={n} className="bg-[#F8FAFC] h-8 rounded-xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <FiBox className="w-12 h-12 text-[#E2E8F0] mx-auto" />
        <h2 className="font-heading font-bold text-2xl text-[#0F172A]">Product Not Found</h2>
        <p className="text-sm text-[#475569]">This equipment model may no longer be listed.</p>
        <Link to="/products" className="inline-flex items-center gap-2 text-sm font-bold text-[#0575B8] hover:text-[#045D93]">
          <FiArrowLeft /> Back to Equipment Showcase
        </Link>
      </div>
    );
  }

  const rawMrp = product.mrp || product.price_inr || 9999;
  const distBuyRate = Math.round(rawMrp * 0.85);
  const fallback = getFallback(product.category, product.name);

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* Breadcrumbs */}
        <nav className="text-xs text-[#475569] flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-[#0575B8]">Home</Link>
          <span>›</span>
          <Link to="/products" className="hover:text-[#0575B8]">Equipment Showcase</Link>
          {product.category && (
            <>
              <span>›</span>
              <Link to={`/products?cat=${product.category}`} className="hover:text-[#0575B8] capitalize">{product.category}</Link>
            </>
          )}
          <span>›</span>
          <span className="text-[#0F172A] font-medium line-clamp-1">{product.name}</span>
        </nav>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Left: Image Showcase */}
          <div className="space-y-3">
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl overflow-hidden aspect-square shadow-xs relative">
              <img
                src={hasImgError ? fallback : (imgSrc || fallback)}
                alt={product.name}
                onError={() => {
                  if (!hasImgError) {
                    setHasImgError(true);
                    setImgSrc(fallback);
                  }
                }}
                className="w-full h-full object-cover"
              />
              {product.badge ? (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-lg text-xs font-extrabold bg-[#F49222] text-white shadow-xs">
                  {product.badge}
                </span>
              ) : (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-lg text-xs font-extrabold bg-[#0575B8] text-white shadow-xs">
                  Tier-1 Certified
                </span>
              )}
            </div>

            {/* Quick spec chips */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-3 rounded-xl shadow-xs">
                <span className="text-[10px] text-[#475569] uppercase block font-medium">Min. Order (MOQ)</span>
                <span className="text-xs font-bold text-[#0F172A]">{product.moq || 1} Unit{(product.moq || 1) > 1 ? 's' : ''}</span>
              </div>
              <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-3 rounded-xl shadow-xs">
                <span className="text-[10px] text-[#475569] uppercase block font-medium">Availability</span>
                <span className="text-xs font-bold text-[#0575B8]">Central Hub Stock</span>
              </div>
              <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-3 rounded-xl shadow-xs">
                <span className="text-[10px] text-[#475569] uppercase block font-medium">Dispatch</span>
                <span className="text-xs font-bold text-[#0F172A]">24–48 Hours</span>
              </div>
            </div>
          </div>

          {/* Right: Product & Distributor Procurement Info */}
          <div className="space-y-5">
            {/* Brand & SKU */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.brand && (
                <span className="text-xs font-bold text-[#0575B8] bg-[#EFF8FF] px-2.5 py-1 rounded-full border border-[#BAE6FD]">
                  {product.brand}
                </span>
              )}
              {product.category && (
                <span className="text-xs text-[#475569] font-medium capitalize">{product.category}</span>
              )}
              {product.sku && (
                <span className="text-xs font-mono text-[#64748B] ml-auto">SKU: {product.sku}</span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A] leading-tight">
              {product.name}
            </h1>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-[#475569] leading-relaxed">{product.description}</p>
            )}

            {/* Partner Procurement Box */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-[#475569] uppercase tracking-wider block font-medium">Standard Retail MRP</span>
                  <span className="font-heading font-black text-3xl text-[#0F172A]">
                    ₹{rawMrp.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-[#64748B] ml-2">Inclusive of standard GST</span>
                </div>
              </div>

              {/* Wholesale Pricing Info */}
              {role === 'distributor' ? (
                <div className="p-4 rounded-xl bg-[#EFF8FF] border border-[#BAE6FD] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#475569] uppercase font-bold tracking-wide block">Your Factory Buy Rate</span>
                      <span className="font-heading font-black text-2xl text-[#0575B8]">
                        ₹{distBuyRate.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#0575B8] bg-white px-3 py-1 rounded-lg border border-[#BAE6FD]">
                      15% Wholesale Margin
                    </span>
                  </div>
                  <Link
                    to="/distributor/portal/procure"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-[#0575B8] text-white hover:bg-[#045D93] shadow-md transition-all"
                  >
                    <FiSliders className="w-4 h-4" /> Open Procurement Console & Order
                  </Link>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#EFF8FF] border border-[#BAE6FD] space-y-3">
                  <div className="flex items-center gap-2 text-[#0575B8] font-bold text-sm">
                    <FiLock className="w-4 h-4 text-[#F49222]" />
                    <span>Distributor & Wholesale Pricing</span>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    Factory-gate buy rates (8% – 25% off MRP), customized quantity slabs, and territorial reservation rights are unlocked inside the <strong>Distributor Dashboard</strong> for verified partners.
                  </p>
                  <div className="pt-1 flex flex-col sm:flex-row items-center gap-2.5">
                    <Link
                      to="/auth/register"
                      className="w-full sm:flex-1 text-center py-3 rounded-xl text-xs font-bold bg-[#0575B8] text-white hover:bg-[#045D93] shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <FiAward className="w-4 h-4 text-[#F49222]" /> Apply for Dealership
                    </Link>
                    <Link
                      to="/auth/login"
                      className="w-full sm:flex-1 text-center py-3 rounded-xl text-xs font-bold text-[#0575B8] hover:bg-[#EFF8FF] bg-white border border-[#BAE6FD] shadow-xs transition-all"
                    >
                      Sign In to Partner Portal
                    </Link>
                  </div>
                </div>
              )}

              {/* Request commercial quote */}
              <Link
                to="/contact"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#EFF8FF] transition-colors"
              >
                <FiFileText className="w-4 h-4 text-[#0575B8]" /> Request Project BOM / Commercial Quote
              </Link>
            </div>

            {/* Delivery & Service info */}
            <div className="space-y-2 pt-2">
              {[
                { icon: FiTruck, text: 'Pan-India dispatch from centralized warehouse hubs' },
                { icon: FiFileText, text: 'GST invoice on every order — 100% ITC eligible for businesses' },
                { icon: FiShield, text: 'Tier-1 certified product with manufacturer warranty coverage' },
                { icon: FiPhone, text: 'Dedicated Regional Manager & Technical Support Desk' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-[#475569]">
                  <Icon className="w-4 h-4 text-[#0575B8] shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Included Kit Components (for BOS Kits) */}
        {product.components && product.components.length > 0 && (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
              <h2 className="font-heading font-bold text-xl text-[#0F172A]">Included BOS Kit Components ({product.components.length})</h2>
              <span className="text-xs text-[#0575B8] font-bold">Factory Pre-Packaged & Tested</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {product.components.map((comp, i) => (
                <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <FiCheckCircle className="w-4 h-4 text-[#0575B8] shrink-0" />
                  <span className="text-xs font-semibold text-[#0F172A]">{comp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Product Features */}
        {product.features && product.features.length > 0 && (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs">
            <h2 className="font-heading font-bold text-xl text-[#0F172A] mb-5">Key Product Highlights</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <FiCheckCircle className="w-4 h-4 text-[#0575B8] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0F172A]">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Technical Specifications */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
              <h2 className="font-heading font-bold text-xl text-[#0F172A]">Technical Specifications</h2>
              <span className="text-xs text-[#0575B8] font-bold">TÜV / IEC / MNRE Certified</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(product.specs).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-xs text-[#475569] font-medium">{key}</span>
                  <span className="text-xs font-bold text-[#0F172A] text-right ml-4">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back link */}
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#475569] hover:text-[#0575B8] transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Equipment Showcase
        </Link>
      </div>
    </div>
  );
}
