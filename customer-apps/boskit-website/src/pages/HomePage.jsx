import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight, FiCheckCircle, FiTruck,
  FiFileText, FiPhone, FiZap, FiShield, FiBox,
  FiUsers, FiMapPin, FiAward, FiLock,
} from 'react-icons/fi';
import api from '../services/api';
import ProductCard from '../components/shop/ProductCard';
import CategoryGrid from '../components/shop/CategoryGrid';
import { useAuth } from '../context/AuthContext';

// ─── 1. Hero Section ──────────────────────────────────────────────────────────

function HeroSection() {
  const { isAuthenticated, role } = useAuth();

  return (
    <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-b from-[#ECF8F1]/70 via-[#F7FAF8] to-[#FFFFFF] border-b border-[#DDE8E1]">
      {/* Decorative background glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#1F8F4E]/8 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto space-y-6">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ECF8F1] border border-[#DDE8E1] text-[#1F8F4E] text-xs font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#1F8F4E] animate-pulse" />
            B2B Solar Equipment Distribution Network
          </div>

          {/* Headline */}
          <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#17211B] leading-[1.1]">
            Become an Authorized{' '}
            <span className="text-[#1F8F4E]">District Solar Distributor</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-[#5F6F65] leading-relaxed max-w-2xl mx-auto">
            Access factory-gate pricing on Tier-1 Inverters, TOPCon Solar Panels, Mounting Structures & Complete BOS Kits. Secure exclusive territory rights and grow your wholesale distribution business across India.
          </p>

          {/* Primary CTA Group */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            {role === 'distributor' ? (
              <Link
                to="/distributor/portal/dashboard"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-3"
              >
                <FiZap className="w-5 h-5 text-[#F5B700]" />
                Open Distributor Portal
              </Link>
            ) : (
              <Link
                to="/auth/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-3"
              >
                <FiAward className="w-5 h-5 text-[#F5B700]" />
                Apply for District Dealership
              </Link>
            )}

            <Link
              to="/products"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl text-base font-bold bg-[#FFFFFF] hover:bg-[#ECF8F1] text-[#1F8F4E] border border-[#1F8F4E]/30 shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <FiBox className="w-5 h-5" />
              Explore Equipment Showcase
            </Link>
          </div>

          {/* Quick Sign In Prompt */}
          {!isAuthenticated && (
            <p className="text-xs text-[#5F6F65] pt-1">
              Already an authorized distributor?{' '}
              <Link to="/auth/login" className="font-bold text-[#1F8F4E] hover:underline">
                Sign in to Partner Portal →
              </Link>
            </p>
          )}

          {/* Trust signals */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#5F6F65]">
            {[
              'Exclusive District Territory Protection',
              'GST Invoice with 100% ITC',
              'Tier-1 Certified Brands Only',
              'Sub-Dealer Onboarding Console',
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5 font-medium">
                <FiCheckCircle className="text-[#1F8F4E] w-3.5 h-3.5 shrink-0" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: '750+', label: 'Authorized Distributors', icon: FiUsers },
            { value: '12,500+', label: 'Active Dealers Nationwide', icon: FiMapPin },
            { value: '450 MW+', label: 'Equipment Dispatched', icon: FiZap },
            { value: '99.4%', label: 'On-Time Fulfillment', icon: FiTruck },
          ].map((stat, i) => (
            <div key={i} className="bg-[#FFFFFF] rounded-2xl p-5 text-center border border-[#DDE8E1] shadow-xs hover:border-[#1F8F4E]/40 hover:shadow-md transition-all">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center text-[#1F8F4E]">
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="font-heading font-extrabold text-2xl text-[#17211B] tracking-tight">{stat.value}</div>
              <div className="text-xs text-[#5F6F65] font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 2. Equipment Portfolio Showcase ──────────────────────────────────────────

function FeaturedProducts({ products, loading }) {
  return (
    <section id="showcase" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-[#DDE8E1]">
        <div>
          <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest bg-[#ECF8F1] px-3 py-1 rounded-full border border-[#DDE8E1]">
            Product Portfolio
          </span>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#17211B] tracking-tight mt-2">
            Certified Solar Equipment Showcase
          </h2>
          <p className="text-xs text-[#5F6F65] mt-1">
            Factory-direct equipment available for procurement inside the Authorized Distributor Portal.
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#1F8F4E] hover:text-[#18733E] group shrink-0"
        >
          View Full Catalogue <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-[#FFFFFF] border border-[#DDE8E1] h-80 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-[#5F6F65]">
          <FiBox className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Equipment catalogue loading — check back shortly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 6).map((item) => (
            <ProductCard
              key={item._id || item.id}
              product={{ ...item, id: item._id || item.id }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── 3. Distributor Tier Plans ────────────────────────────────────────────────

function DistributorPlansSection({ plans, loading }) {
  if (loading || plans.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-[#F7FAF8] rounded-3xl p-8 sm:p-12 border border-[#DDE8E1]">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest bg-[#ECF8F1] px-3 py-1 rounded-full border border-[#DDE8E1]">
            DISTRIBUTOR TIERS
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#17211B] tracking-tight mt-1">
            Territorial Distributor Plans
          </h2>
          <p className="text-sm text-[#5F6F65]">
            Select your territory scale. Every plan includes guaranteed exclusive territorial rights, customized dealer pricing controls, and direct marketing leads.
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
                  {plan.badge_text || "Most Popular Plan"}
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
                  to={`/distributor/onboarding?plan=${plan.plan_code || plan.id}`}
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
  );
}

// ─── 4. Rapid Onboarding Steps ────────────────────────────────────────────────

function OnboardingStepsSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-[#FFFFFF] rounded-3xl p-8 sm:p-12 border border-[#DDE8E1] shadow-xs">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest bg-[#ECF8F1] px-3 py-1 rounded-full border border-[#DDE8E1]">
            Rapid Onboarding
          </span>
          <h2 className="font-heading font-bold text-3xl text-[#17211B]">
            How to Become an Authorized Distributor
          </h2>
          <p className="text-sm text-[#5F6F65]">
            4-step streamlined verification process to lock your territory and gain wholesale dashboard access.
          </p>
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
  );
}

// ─── 5. Why Choose Section ────────────────────────────────────────────────────

function WhyChooseSection() {
  const props = [
    {
      title: 'Factory-Gate Wholesale Pricing',
      desc: 'Zero broker markups. Transparent factory buy rates on every Tier-1 inverter, module, and BOS kit.',
      icon: FiZap,
      badge: 'Direct Pricing',
    },
    {
      title: 'Exclusive Territory Protection',
      desc: 'Lock your district. Sub-dealers and EPC buyers in your territory are routed to your account.',
      icon: FiShield,
      badge: 'Territory Lock',
    },
    {
      title: 'Pan-India Warehouse Network',
      desc: '48-hour hub dispatches with insurance coverage, automated waybills, and live tracking.',
      icon: FiTruck,
      badge: 'Fast Dispatch',
    },
    {
      title: 'Sub-Dealer Management Console',
      desc: 'Set custom markup margins, onboard local installers, and manage territorial dealer networks.',
      icon: FiUsers,
      badge: 'Dealer Tools',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
        <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest bg-[#ECF8F1] px-3 py-1 rounded-full border border-[#DDE8E1]">
          Partner Advantages
        </span>
        <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#17211B] tracking-tight">
          Why Partner with SolarKits BOS
        </h2>
        <p className="text-sm text-[#5F6F65]">
          A complete commercial distribution ecosystem designed for solar entrepreneurs and EPC distributors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {props.map((prop, idx) => {
          const Icon = prop.icon;
          return (
            <div
              key={idx}
              className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DDE8E1] shadow-xs flex flex-col gap-4 hover:shadow-md hover:border-[#1F8F4E]/40 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center text-[#1F8F4E] shadow-xs">
                <Icon className="w-5 h-5" />
              </div>
              <span className="inline-block text-[11px] font-bold text-[#1F8F4E] bg-[#ECF8F1] px-2 py-0.5 rounded border border-[#DDE8E1] self-start">
                {prop.badge}
              </span>
              <div>
                <h3 className="font-heading font-bold text-base text-[#17211B] leading-snug">{prop.title}</h3>
                <p className="text-sm text-[#5F6F65] leading-relaxed mt-1">{prop.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── 6. Bottom Banner CTA ─────────────────────────────────────────────────────

function BottomCTASection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-[#ECF8F1] via-[#F7FAF8] to-[#ECF8F1] border border-[#DDE8E1] shadow-xs relative overflow-hidden">
        <div className="max-w-2xl space-y-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F5B700] text-[#17211B] inline-block shadow-xs">
            Territories Open For FY 2026
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-4xl tracking-tight text-[#17211B]">
            Ready to Claim Your District Territory Exclusivity?
          </h2>
          <p className="text-[#5F6F65] font-medium text-sm sm:text-base">
            Join 750+ commercial distributors accelerating their solar wholesale revenue across India.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to="/auth/register"
              className="px-7 py-3.5 rounded-xl text-sm font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              Apply as Distributor <FiArrowRight className="w-4 h-4 text-[#F5B700]" />
            </Link>
            <Link
              to="/plans"
              className="px-6 py-3.5 rounded-xl text-sm font-bold bg-[#FFFFFF] hover:bg-[#ECF8F1] text-[#17211B] border border-[#DDE8E1] shadow-xs flex items-center justify-center transition-all"
            >
              View Distributor Plans
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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

  return (
    <div className="space-y-20 pb-20 bg-[#FFFFFF]">
      {/* 1. Hero — Distributor Partner Onboarding Focus */}
      <HeroSection />

      {/* 2. Shop by Category */}
      <CategoryGrid
        title="Equipment Categories"
        subtitle="Explore our certified solar BOS & equipment portfolio"
      />

      {/* 3. Product & Brand Showcase */}
      <FeaturedProducts
        products={products}
        loading={loading}
      />

      {/* 4. Territorial Distributor Plans */}
      <DistributorPlansSection plans={plans} loading={loading} />

      {/* 5. Rapid Onboarding 4 Steps */}
      <OnboardingStepsSection />

      {/* 6. Partner Advantages */}
      <WhyChooseSection />

      {/* 7. Bottom CTA */}
      <BottomCTASection />
    </div>
  );
}
