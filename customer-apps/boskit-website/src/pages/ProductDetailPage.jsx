import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiBox,
  FiShield,
  FiCheckCircle,
  FiLock,
  FiDownload,
  FiTruck,
  FiShare2,
  FiFileText,
} from 'react-icons/fi';
import api from '../services/api';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await api.get(`/public/products/${id}`);
        if (res.data?.product) {
          setProduct(res.data.product);
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
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-[#FFFFFF] border border-[#DDE8E1] h-96 rounded-3xl animate-pulse shadow-xs" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-heading font-bold text-2xl text-[#17211B]">Product Not Found</h2>
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-[#1F8F4E] font-bold">
          <FiArrowLeft /> Return to Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 bg-[#FFFFFF]">
      
      {/* Back Link */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-xs font-bold text-[#5F6F65] hover:text-[#1F8F4E] transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" /> Back to Equipment Catalogue
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left: Product Image */}
        <div className="space-y-4">
          <div className="w-full h-96 sm:h-[450px] rounded-3xl bg-[#F7FAF8] overflow-hidden border border-[#DDE8E1] relative shadow-xs">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.badge && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-lg text-xs font-bold bg-[#F5B700] text-[#17211B] shadow-xs">
                {product.badge}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#FFFFFF] border border-[#DDE8E1] p-3 rounded-xl shadow-xs">
              <span className="text-[10px] text-[#5F6F65] uppercase block font-medium">Minimum Order</span>
              <span className="text-xs font-bold text-[#17211B]">{product.moq || 1} Units</span>
            </div>
            <div className="bg-[#FFFFFF] border border-[#DDE8E1] p-3 rounded-xl shadow-xs">
              <span className="text-[10px] text-[#5F6F65] uppercase block font-medium">Availability</span>
              <span className="text-xs font-bold text-[#1F8F4E]">In Stock (Hub)</span>
            </div>
            <div className="bg-[#FFFFFF] border border-[#DDE8E1] p-3 rounded-xl shadow-xs">
              <span className="text-[10px] text-[#5F6F65] uppercase block font-medium">Dispatch</span>
              <span className="text-xs font-bold text-[#17211B]">24 – 48 Hours</span>
            </div>
          </div>
        </div>

        {/* Right: Info & Pricing */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest">{product.brand || 'SolarKits Pro'}</span>
              <span className="text-[#DDE8E1]">•</span>
              <span className="font-mono text-xs text-[#5F6F65]">SKU: {product.sku}</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#17211B] leading-tight">
              {product.name}
            </h1>
          </div>

          <p className="text-sm text-[#5F6F65] leading-relaxed">
            {product.description}
          </p>

          {/* Pricing Box */}
          <div className="bg-[#FFFFFF] border border-[#DDE8E1] p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-[#5F6F65] uppercase tracking-wider block font-medium">Standard Retail Price (MRP)</span>
                <span className="font-heading font-black text-3xl text-[#17211B]">
                  ₹{(product.mrp || 9999).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-[#5F6F65] ml-2">Inclusive of standard GST</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] space-y-3">
              <div className="flex items-center gap-2 text-[#1F8F4E] font-bold text-sm">
                <FiLock className="w-4 h-4 text-[#F5B700]" />
                <span>Distributor & Dealer Wholesale Slabs</span>
              </div>
              <p className="text-xs text-[#5F6F65] leading-relaxed">
                Sign in with your approved partner credentials to view tier-discounted price rules (8% – 25% off MRP), customized quantity slabs, and place instant reservation orders.
              </p>
              <div className="pt-1 flex items-center gap-3">
                <Link
                  to="/auth/login"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-xs"
                >
                  Sign In to Unlock Rate
                </Link>
                <Link
                  to="/auth/register"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#1F8F4E] hover:bg-[#ECF8F1] bg-white border border-[#DDE8E1] shadow-xs"
                >
                  Apply for Dealership
                </Link>
              </div>
            </div>
          </div>

          {/* Key Features List */}
          {product.features && (
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-sm text-[#17211B] uppercase tracking-wider">Key Product Highlights</h3>
              <ul className="space-y-2 text-xs text-[#17211B]">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <FiCheckCircle className="w-4 h-4 text-[#1F8F4E] shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>

      {/* Specifications Table */}
      {product.specs && Object.keys(product.specs).length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#DDE8E1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#DDE8E1]">
            <h2 className="font-heading font-bold text-xl text-[#17211B]">Technical Specifications</h2>
            <span className="text-xs text-[#1F8F4E] font-bold font-mono">TÜV / IEC / MNRE Certified</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(product.specs).map(([key, val]) => (
              <div key={key} className="p-4 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] flex items-center justify-between">
                <span className="text-xs text-[#5F6F65] font-medium">{key}</span>
                <span className="text-xs font-bold text-[#17211B] text-right">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
