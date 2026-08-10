// src/components/landing/PlansSection.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Shield, ArrowRight, Star, Layers, Sun } from 'lucide-react';
import { amcPlans as defaultMockPlans } from '../../mocks/data';

const defaultSaasPlans = [
  {
    id: "saas-starter",
    name: "Starter Plan",
    category: "SaaS Subscription",
    description: "Ideal for small solar contractors & single-region installers.",
    basePrice: 49,
    currencySymbol: "$",
    billing: "Monthly",
    status: "Active",
    isBestSeller: false,
    isPremium: false,
    buttonText: "CHECKOUT STARTER",
    features: [
      "Up to 10 users",
      "1 country",
      "Basic analytics",
      "Email support",
      "5 GB storage",
    ],
  },
  {
    id: "saas-professional",
    name: "Professional Plan",
    category: "SaaS Subscription",
    description: "Perfect for growing EPC companies scaling residential & commercial projects.",
    basePrice: 149,
    currencySymbol: "$",
    billing: "Monthly",
    status: "Active",
    isBestSeller: true,
    isPremium: false,
    buttonText: "CHECKOUT PROFESSIONAL",
    features: [
      "Up to 100 users",
      "5 countries",
      "Advanced analytics",
      "Priority support",
      "50 GB storage",
    ],
  },
  {
    id: "saas-enterprise",
    name: "Enterprise Plan",
    category: "SaaS Subscription",
    description: "Built for multi-country solar enterprises requiring full BI analytics.",
    basePrice: 499,
    currencySymbol: "$",
    billing: "Monthly",
    status: "Active",
    isBestSeller: false,
    isPremium: true,
    buttonText: "CHECKOUT ENTERPRISE",
    features: [
      "Unlimited users",
      "20 countries",
      "Full analytics suite",
      "Dedicated account manager",
      "500 GB storage",
      "Custom integrations",
    ],
  },
  {
    id: "saas-custom",
    name: "Custom Plan",
    category: "SaaS Subscription",
    description: "Tailored solution with custom BI, white-glove onboarding & dedicated SLA.",
    basePrice: 0,
    customPriceText: "Contact Sales",
    currencySymbol: "$",
    billing: "Monthly",
    status: "Active",
    isBestSeller: false,
    isPremium: true,
    buttonText: "CHECKOUT CUSTOM",
    features: [
      "Unlimited everything",
      "Custom integrations",
      "White glove support",
      "Custom BI dashboard",
      "SLA guarantee",
    ],
  },
];

export default function PlansSection() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('epc'); // 'epc' | 'amc'
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    let isMounted = true;
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const endpoint = activeTab === 'epc' ? `${API_URL}/api/epc-plans` : `${API_URL}/api/amc-plans`;
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          if (isMounted) setPlans(result.data);
        } else {
          if (isMounted) setPlans(activeTab === 'epc' ? defaultSaasPlans : defaultMockPlans);
        }
      } catch (err) {
        console.warn('API error, falling back to default plans:', err);
        if (isMounted) setPlans(activeTab === 'epc' ? defaultSaasPlans : defaultMockPlans);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPlans();
    return () => { isMounted = false; };
  }, [API_URL, activeTab]);

  // Determine displaying plans based on active tab ('epc' vs 'amc')
  const displayPlans = plans.length > 0
    ? plans
    : (activeTab === 'epc' ? defaultSaasPlans : defaultMockPlans);

  // Clean price formatter
  const formatPriceValue = (val, isCustom, customText, symbol) => {
    if (isCustom || customText) return customText || 'Contact Sales';
    let num = Number(val) || 0;
    if (num > 50000000) num = Math.round(num / 10000);
    else if (num > 2000000) num = Math.round(num / 1000);

    const formatted = num.toLocaleString('en-IN');
    return `${symbol || '$'}${formatted}`;
  };

  return (
    <section id="plans" className="py-24 lg:py-36 bg-gradient-to-b from-bg via-white to-bg relative">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-14 space-y-5">
          <div className="inline-flex items-center gap-2 bg-solar/20 border border-solar/40 rounded-full px-4 py-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-solar animate-pulse" />
            <span className="text-xs font-extrabold text-navy tracking-wider uppercase">
              EPC Plans & Subscriptions
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-navy tracking-tight leading-tight">
            EPC Plans for Solar Contractors & EPC Companies
          </h2>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Flexible software pricing tiers managed live from your Admin Panel under <strong>EPC Plans</strong>. Select the ideal plan for your business.
          </p>

          {/* Main Plan Type Selector: EPC Plans vs AMC Service Plans */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('epc')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all duration-300 shadow-md ${
                activeTab === 'epc'
                  ? 'bg-navy text-solar scale-105 shadow-navy/30 ring-2 ring-solar'
                  : 'bg-white text-text-secondary hover:text-navy hover:bg-navy-50 border border-border'
              }`}
            >
              <Layers className="w-4 h-4 text-solar" />
              <span>EPC Plans</span>
            </button>

            <button
              onClick={() => setActiveTab('amc')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all duration-300 shadow-md ${
                activeTab === 'amc'
                  ? 'bg-navy text-solar scale-105 shadow-navy/30 ring-2 ring-solar'
                  : 'bg-white text-text-secondary hover:text-navy hover:bg-navy-50 border border-border'
              }`}
            >
              <Sun className="w-4 h-4 text-solar" />
              <span>Solar AMC Service Plans</span>
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="pt-4 flex items-center justify-center gap-4">
            <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-navy font-extrabold' : 'text-text-secondary'}`}>
              Monthly Billing
            </span>

            <button
              onClick={() => setBillingCycle(billingCycle === 'annual' ? 'monthly' : 'annual')}
              className="w-16 h-9 rounded-full bg-navy p-1 transition-colors relative flex items-center cursor-pointer shadow-inner"
              aria-label="Toggle billing cycle"
            >
              <div
                className={`w-7 h-7 rounded-full bg-solar shadow-md transition-transform duration-300 transform ${
                  billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>

            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${billingCycle === 'annual' ? 'text-navy font-extrabold' : 'text-text-secondary'}`}>
                Annual Billing
              </span>
              <span className="text-xs font-extrabold text-navy-900 bg-solar px-2.5 py-1 rounded-full shadow-xs animate-pulse-soft">
                Save 20%
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-8 border border-border animate-pulse space-y-6 shadow-md">
                <div className="h-7 bg-navy-100 rounded w-2/3" />
                <div className="h-4 bg-navy-50 rounded w-full" />
                <div className="h-24 bg-bg rounded-2xl" />
                <div className="space-y-3 pt-4">
                  <div className="h-4 bg-navy-50 rounded" />
                  <div className="h-4 bg-navy-50 rounded" />
                  <div className="h-4 bg-navy-50 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Dynamic Pricing Cards Grid */
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className={`grid grid-cols-1 ${displayPlans.length === 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'} gap-8 lg:gap-8 items-stretch`}
            >
              {displayPlans.map((plan, index) => {
                const isPopular = plan.isBestSeller || plan.isPopular || plan.id === 'saas-professional' || plan.type === 'cleaning_maintenance';
                const isPremium = plan.isPremium || plan.id === 'saas-enterprise' || plan.id === 'saas-custom';

                // Calculate price
                let rawAnnualPrice = Number(plan.basePrice || plan.priceAnnual || 0);
                if (rawAnnualPrice > 50000000) rawAnnualPrice = Math.round(rawAnnualPrice / 10000);
                else if (rawAnnualPrice > 2000000) rawAnnualPrice = Math.round(rawAnnualPrice / 1000);

                const isCustomPrice = plan.customPriceText || plan.name.toLowerCase().includes('custom');
                const price = isCustomPrice
                  ? 0
                  : (billingCycle === 'annual' ? Math.round(rawAnnualPrice * 10) : rawAnnualPrice);

                const currencySymbol = plan.currencySymbol || (activeTab === 'saas' ? '$' : '₹');
                const buttonText = plan.buttonText || `CHECKOUT ${plan.name.toUpperCase().replace(' PLAN', '')}`;
                const servicesList = plan.features || plan.services || [];

                return (
                  <motion.div
                    key={plan.id || index}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`bg-white rounded-3xl p-7 sm:p-8 lg:p-9 border ${
                      isPopular
                        ? 'border-solar shadow-2xl ring-4 ring-solar/40 scale-[1.02] z-10'
                        : isPremium
                        ? 'border-navy-400 shadow-xl bg-gradient-to-b from-white to-navy-50/30'
                        : 'border-border shadow-card'
                    } relative flex flex-col justify-between transition-all duration-300 hover:shadow-card-lg hover:-translate-y-1 group`}
                  >
                    {/* Popular Header Badge */}
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-navy text-solar font-black text-xs px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1.5 border border-solar/40">
                        <Star className="w-4 h-4 text-solar fill-solar" />
                        <span>MOST POPULAR CHOICE</span>
                      </div>
                    )}

                    <div>
                      {/* Plan Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-xl sm:text-2xl font-black text-navy leading-snug">
                          {plan.name}
                        </h3>
                        <span className="text-xs font-extrabold text-success bg-success-50 px-2.5 py-1 rounded-full border border-success-200 shrink-0">
                          Active
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6 min-h-[44px]">
                        {plan.description}
                      </p>

                      {/* Pricing Box */}
                      <div className="mb-6 p-5 rounded-2xl bg-bg border border-border/80 shadow-xs">
                        {isCustomPrice ? (
                          <div>
                            <span className="text-3xl sm:text-4xl font-black text-navy tracking-tight block">
                              Contact Sales
                            </span>
                            <span className="text-xs font-semibold text-text-secondary mt-1 block">
                              Billed monthly • Instant Setup
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl sm:text-4xl font-black text-navy tracking-tight">
                                {formatPriceValue(price, false, null, currencySymbol)}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-text-secondary">
                                / {billingCycle === 'annual' ? 'yr' : 'mo'}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-text-secondary mt-1 block">
                              Billed {billingCycle} • Instant Setup
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Service / Capability Feature Checklist */}
                      <div className="space-y-3 mb-8 border-t border-border/60 pt-4">
                        {servicesList.map((service, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2.5">
                            <div className="w-4 h-4 rounded-full bg-success-50 text-success flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                              <Check className="w-3 h-3" />
                            </div>
                            <span className="text-xs sm:text-sm text-navy/90 font-semibold leading-snug">
                              {service}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <a
                      href="/register"
                      className={`w-full text-center py-4 px-5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                        isPopular
                          ? 'bg-solar hover:bg-solar-600 text-navy-900 shadow-solar/30 hover:shadow-xl hover:scale-[1.02]'
                          : isPremium
                          ? 'bg-navy hover:bg-navy-800 text-white shadow-navy/20 hover:shadow-xl hover:scale-[1.02]'
                          : 'bg-navy hover:bg-navy-800 text-white hover:scale-[1.01]'
                      }`}
                    >
                      <span>{buttonText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Footnote */}
        <div className="mt-14 text-center text-xs sm:text-sm text-text-secondary flex items-center justify-center gap-2 font-medium">
          <Shield className="w-4 h-4 text-solar-900 shrink-0" />
          <span>Plans synchronized live with your Admin Panel (`AmcPlans.jsx`). Custom SaaS & AMC tiers supported.</span>
        </div>
      </div>
    </section>
  );
}
