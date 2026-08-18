import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiZap,
  FiShield,
  FiTrendingUp,
  FiTruck,
  FiLayers,
  FiArrowRight,
  FiCheckCircle,
  FiAward,
  FiMapPin,
  FiUsers,
  FiLock,
  FiBox,
  FiStar,
} from 'react-icons/fi';
import api from '../services/api';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, planRes] = await Promise.all([
          api.get('/public/products?limit=6'),
          api.get('/public/plans'),
        ]);
        if (prodRes.data?.products) setProducts(prodRes.data.products);
        if (planRes.data?.plans) setPlans(planRes.data.plans);
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = [
    { value: '750+', label: 'Registered Distributors', icon: FiUsers },
    { value: '12,500+', label: 'Active Solar Dealers', icon: FiMapPin },
    { value: '450 MW+', label: 'Equipment Dispatched', icon: FiZap },
    { value: '99.4%', label: 'On-Time Fulfillment', icon: FiTruck },
  ];

  const valueProps = [
    {
      title: 'Protected Territorial Exclusivity',
      desc: 'Lock in your revenue district or entire state. No competing distributors in your approved jurisdiction.',
      icon: FiShield,
      badge: 'Exclusive Rights',
    },
    {
      title: 'Direct Manufacturer Gate Pricing',
      desc: 'Transparent integer-accurate wholesale pricing matrix with tiered volume slabs and maximum retail protection.',
      icon: FiTrendingUp,
      badge: 'Zero Broker Margin',
    },
    {
      title: 'Dealer Network Onboarding Engine',
      desc: 'Onboard and manage your own regional dealers with custom price slabs, assigned products, and direct settlement.',
      icon: FiLayers,
      badge: 'Dealer Portal Included',
    },
    {
      title: '48-Hour Hub Dispatches',
      desc: 'Centralized warehouse reserve inventory with automated waybills, insurance, and real-time live logistics tracking.',
      icon: FiTruck,
      badge: 'National Transit Hubs',
    },
  ];

  return (
    <div className="space-y-20 pb-20 bg-[#FFFFFF]">
      
      {/* ── 1. Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-12 sm:pt-20 pb-16 overflow-hidden bg-gradient-to-b from-[#ECF8F1]/60 via-[#F7FAF8] to-[#FFFFFF] border-b border-[#DDE8E1]">
        {/* Subtle decorative glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#1F8F4E]/10 blur-[90px] pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ECF8F1] border border-[#DDE8E1] text-[#1F8F4E] text-xs sm:text-sm font-bold shadow-xs animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-[#1F8F4E] animate-pulse" />
              <span>India's Dedicated B2B Solar Distribution Platform</span>
            </div>

            {/* Headline */}
            <h1 className="font-heading font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight text-[#17211B] leading-[1.1]">
              Power Your <span className="text-[#1F8F4E]">Solar Distribution</span> Network
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-[#5F6F65] leading-relaxed max-w-2xl mx-auto">
              Direct factory-gate pricing on Tier-1 Inverters, TOPCon Modules, Pre-Engineered Mounting, and BOS Kits with guaranteed territorial exclusivity for authorized distributors.
            </p>

            {/* CTA Group */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/auth/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-3"
              >
                <FiAward className="w-5 h-5 text-[#F5B700]" />
                Apply for Distributor Dealership
              </Link>
              <Link
                to="/products"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl text-base font-bold bg-[#FFFFFF] hover:bg-[#ECF8F1] text-[#1F8F4E] border-1.5 border-[#1F8F4E] shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <FiBox className="w-5 h-5 text-[#1F8F4E]" />
                Browse Equipment Catalogue
              </Link>
            </div>

            {/* Subtext info */}
            <div className="pt-2 flex items-center justify-center gap-6 text-xs text-[#5F6F65]">
              <span className="flex items-center gap-1.5 font-medium"><FiCheckCircle className="text-[#1F8F4E] w-4 h-4" /> Instant GST Verification</span>
              <span className="flex items-center gap-1.5 font-medium"><FiCheckCircle className="text-[#1F8F4E] w-4 h-4" /> Zero Broker Markups</span>
              <span className="flex items-center gap-1.5 font-medium"><FiCheckCircle className="text-[#1F8F4E] w-4 h-4" /> 100% ITC Eligible</span>
            </div>
          </div>

          {/* KPI Stats Bar */}
          <div className="mt-16 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-[#FFFFFF] rounded-2xl p-6 text-center border border-[#DDE8E1] shadow-xs hover:border-[#1F8F4E]/40 hover:shadow-md transition-all">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center text-[#1F8F4E]">
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="font-heading font-extrabold text-2xl sm:text-3xl text-[#17211B] tracking-tight">{stat.value}</div>
                <div className="text-xs sm:text-sm text-[#5F6F65] font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Value Proposition Grid ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest bg-[#ECF8F1] px-3 py-1 rounded-full border border-[#DDE8E1]">
            Commercial Benefits
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#17211B] tracking-tight">
            Engineered to Scale Your Solar Supply Chain
          </h2>
          <p className="text-sm text-[#5F6F65]">
            Everything needed to establish and operate a high-margin regional solar wholesale depot.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {valueProps.map((prop, idx) => (
            <div
              key={idx}
              className="bg-[#FFFFFF] rounded-2xl p-7 border border-[#DDE8E1] shadow-xs flex flex-col justify-between hover:shadow-md hover:border-[#1F8F4E]/40 transition-all duration-200"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center text-[#1F8F4E] shadow-xs">
                  <prop.icon className="w-6 h-6" />
                </div>
                <span className="inline-block text-[11px] font-bold text-[#1F8F4E] bg-[#ECF8F1] px-2 py-0.5 rounded border border-[#DDE8E1]">
                  {prop.badge}
                </span>
                <h3 className="font-heading font-bold text-lg text-[#17211B] leading-snug">{prop.title}</h3>
                <p className="text-sm text-[#5F6F65] leading-relaxed">{prop.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Featured Equipment Catalogue ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-[#DDE8E1]">
          <div>
            <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest bg-[#ECF8F1] px-3 py-1 rounded-full border border-[#DDE8E1]">
              Commercial Inventory
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#17211B] tracking-tight mt-2">
              Featured Solar Equipment
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#1F8F4E] hover:text-[#18733E] group"
          >
            View Full Catalogue ({products.length > 0 ? '50+ Items' : 'Catalogue'}) <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-[#FFFFFF] border border-[#DDE8E1] h-80 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.slice(0, 6).map((item) => (
              <div
                key={item._id || item.id}
                className="bg-[#FFFFFF] border border-[#DDE8E1] rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-[#1F8F4E]/50 hover:shadow-md transition-all duration-300 shadow-xs"
              >
                <div>
                  <div className="h-48 w-full bg-[#F7FAF8] relative overflow-hidden border-b border-[#DDE8E1]">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80'}
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.badge && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#F5B700] text-[#17211B] shadow-xs">
                        {item.badge}
                      </span>
                    )}
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FFFFFF]/95 text-[#5F6F65] border border-[#DDE8E1] shadow-xs">
                      MOQ: {item.moq || 1}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#5F6F65]">
                      <span className="font-semibold text-[#1F8F4E]">{item.brand || 'SolarKits Pro'}</span>
                      <span>SKU: {item.sku}</span>
                    </div>

                    <h3 className="font-heading font-bold text-base text-[#17211B] group-hover:text-[#1F8F4E] transition-colors line-clamp-2">
                      {item.name}
                    </h3>

                    <p className="text-xs text-[#5F6F65] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#5F6F65] uppercase tracking-wider block">Standard MRP</span>
                      <span className="text-sm font-bold text-[#17211B]">
                        ₹{(item.mrp || 9999).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1F8F4E] bg-[#ECF8F1] px-2 py-1 rounded-md border border-[#DDE8E1]">
                        <FiLock className="w-3 h-3 text-[#F5B700]" /> Login for Wholesale
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 4. Distributor Plans Teaser ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#F7FAF8] rounded-3xl p-8 sm:p-12 border border-[#DDE8E1]">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest bg-[#ECF8F1] px-3 py-1 rounded-full border border-[#DDE8E1]">
              DISTRIBUTOR TIERS
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#17211B] tracking-tight mt-1">
              Territorial Distributor Plans
            </h2>
            <p className="text-sm text-[#5F6F65]">
              Select your territory scale. Every plan includes guaranteed exclusive rights, customized dealer pricing controls, and marketing referral leads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div
                key={plan.id || index}
                className={`rounded-2xl p-7 flex flex-col justify-between transition-all duration-300 relative ${
                  plan.is_popular
                    ? 'bg-[#FFFFFF] border-2 border-[#1F8F4E] shadow-lg scale-105'
                    : 'bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs hover:shadow-md'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#F5B700] text-[#17211B] shadow-xs">
                    {plan.badge_text || "Most Popular Distributor Plan"}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="font-heading font-bold text-xl text-[#17211B]">{plan.name}</h3>
                    <p className="text-xs text-[#5F6F65] mt-1 leading-relaxed">{plan.short_description || plan.description}</p>
                  </div>

                  <div className="pt-2 pb-4 border-y border-[#DDE8E1]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-[#5F6F65] font-medium">Joining Fee:</span>
                      <span className="font-heading font-extrabold text-2xl text-[#1F8F4E]">
                        ₹{(plan.joining_fee_inr || 25000).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5F6F65] mt-1">
                      Validity: <strong className="text-[#17211B]">{plan.validity_display || `${plan.validity_value || 12} Months`}</strong> | Territory: <strong className="text-[#17211B]">{plan.allowed_territories_count || 1} {plan.territory_type || plan.territory_level || 'District'} ({plan.is_territory_exclusive ? 'Exclusive' : 'Shared'})</strong>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-[#17211B]">
                    {(plan.benefits || plan.features)?.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2">
                        <FiCheckCircle className="w-4 h-4 text-[#1F8F4E] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    to={`/distributor/onboarding?plan=${plan.plan_code}`}
                    className={`w-full py-3 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      plan.is_popular
                        ? 'bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-sm'
                        : 'bg-[#F7FAF8] hover:bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]'
                    }`}
                  >
                    Select Plan & Onboard <FiArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. How Onboarding Works ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FFFFFF] rounded-3xl p-8 sm:p-12 border border-[#DDE8E1] shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest bg-[#ECF8F1] px-3 py-1 rounded-full border border-[#DDE8E1]">
              Rapid Onboarding
            </span>
            <h2 className="font-heading font-bold text-3xl text-[#17211B]">
              How to Become an Authorized Distributor
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Account Creation', desc: 'Register with company email & mobile, verify with 6-digit OTP.' },
              { step: '02', title: 'GST Auto-Fetch', desc: 'Input GSTIN to instantly verify legal registration and trade address.' },
              { step: '03', title: 'Territory Lock', desc: 'Select your exclusive revenue district & choose your distributor tier plan.' },
              { step: '04', title: 'Approval & Orders', desc: 'Admin reviews within 24h. Gain wholesale portal access and dealer onboard rights.' },
            ].map((s, idx) => (
              <div key={idx} className="relative p-5 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] space-y-2 hover:border-[#1F8F4E]/40 transition-colors">
                <span className="font-heading font-black text-3xl text-[#DDE8E1]">{s.step}</span>
                <h4 className="font-heading font-bold text-base text-[#17211B]">{s.title}</h4>
                <p className="text-xs text-[#5F6F65] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Bottom Banner CTA ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-[#ECF8F1] via-[#F7FAF8] to-[#ECF8F1] border border-[#DDE8E1] text-[#17211B] relative overflow-hidden shadow-xs">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F5B700] text-[#17211B] inline-block shadow-xs">
              Territories Open For FY 2026
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-5xl tracking-tight leading-tight text-[#17211B]">
              Ready to Claim Your District Territory Exclusivity?
            </h2>
            <p className="text-[#5F6F65] font-medium text-sm sm:text-base">
              Join 750+ commercial distributors accelerating their solar wholesale revenue across India.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                to="/auth/register"
                className="px-8 py-4 rounded-xl text-sm font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                Start Distributor Application <FiArrowRight className="w-4 h-4 text-[#F5B700]" />
              </Link>
              <Link
                to="/contact"
                className="px-6 py-4 rounded-xl text-sm font-bold bg-[#FFFFFF] hover:bg-[#ECF8F1] text-[#17211B] border border-[#DDE8E1] shadow-xs flex items-center justify-center transition-all"
              >
                Schedule Regional Briefing
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
