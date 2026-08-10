// src/pages/amc-plans/AMCPlanListPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Star, Globe } from 'lucide-react';
import Badge from '../../components/common/Badge';
import { amcPlans as mockAmcPlans } from '../../mocks/data';

const COUNTRY_FLAG_MAP = {
  IN: '🇮🇳',
  AU: '🇦🇺',
  US: '🇺🇸',
  GB: '🇬🇧',
  CA: '🇨🇦',
  DE: '🇩🇪',
  FR: '🇫🇷',
  AE: '🇦🇪',
};

const getCountryFlag = (code, countryName) => {
  if (countryName) {
    const c = countryName.toLowerCase();
    if (c.includes('australia')) return '🇦🇺';
    if (c.includes('india')) return '🇮🇳';
    if (c.includes('united states') || c.includes('us')) return '🇺🇸';
    if (c.includes('united kingdom') || c.includes('uk')) return '🇬🇧';
    if (c.includes('canada')) return '🇨🇦';
    if (c.includes('germany')) return '🇩🇪';
    if (c.includes('france')) return '🇫🇷';
    if (c.includes('emirates') || c.includes('uae')) return '🇦🇪';
  }
  if (code && COUNTRY_FLAG_MAP[code.toUpperCase()]) {
    return COUNTRY_FLAG_MAP[code.toUpperCase()];
  }
  return '🌐';
};

export default function AMCPlanListPage() {
  const [plans, setPlans] = useState(mockAmcPlans);
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('All');

  const planColorMap = {
    plan1: 'border-info/30 bg-info/3',
    plan2: 'border-success/30 bg-success/3',
    plan3: 'border-solar/30 bg-solar/3',
    plan4: 'border-navy/20 bg-navy/3',
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/amc-plans`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setPlans(result.data.map(p => ({
          ...p,
          id: p._id || p.planId || p.id,
          country: p.country || 'India',
          countryCode: p.countryCode || 'IN',
          currencySymbol: p.currencySymbol || '₹',
          pricePerKW: p.pricePerKw || p.pricePerKW || 0,
          services: Array.isArray(p.features) ? p.features : (p.services || []),
          slaResponse: p.slaResponse || (typeof p.sla === 'object' ? p.sla?.response : p.sla) || '24 Hours',
          activeContracts: p.subscribersCount !== undefined ? p.subscribersCount : (p.activeContracts || 0),
          status: p.status ? p.status.toLowerCase() : 'active',
        })));
      }
    } catch (err) {
      console.warn("Using mock AMC plans as fallback:", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Extract unique countries from loaded plans
  const availableCountries = Array.from(
    new Set(plans.map((p) => p.country || 'India'))
  ).filter(Boolean);

  const filteredPlans = plans.filter((plan) => {
    if (selectedCountry === 'All') return true;
    return (plan.country || 'India').toLowerCase() === selectedCountry.toLowerCase();
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">AMC Plans</h1>
          <p className="page-subtitle">Configure and manage the AMC plans you offer to customers</p>
        </div>
      </div>

      {/* Country Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <Globe size={14} className="text-solar" />
          <span>Filter by Country:</span>
        </div>

        <button
          onClick={() => setSelectedCountry('All')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            selectedCountry === 'All'
              ? 'bg-solar text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>All Countries</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            selectedCountry === 'All' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {plans.length}
          </span>
        </button>

        {availableCountries.map((cName) => {
          const matchedPlan = plans.find((p) => (p.country || 'India').toLowerCase() === cName.toLowerCase());
          const flag = getCountryFlag(matchedPlan?.countryCode, cName);
          const count = plans.filter((p) => (p.country || 'India').toLowerCase() === cName.toLowerCase()).length;
          const isSelected = selectedCountry.toLowerCase() === cName.toLowerCase();

          return (
            <button
              key={cName}
              onClick={() => setSelectedCountry(cName)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-solar text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>{flag}</span>
              <span>{cName}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isSelected ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {filteredPlans.map((plan) => {
          const countryName = plan.country || 'India';
          const countryCode = plan.countryCode || 'IN';
          const flagEmoji = getCountryFlag(countryCode, countryName);
          const servicesList = Array.isArray(plan.features) ? plan.features : (plan.services || []);
          const slaResp = plan.slaResponse || (typeof plan.sla === 'object' ? plan.sla?.response : plan.sla) || '24 Hours';
          const symbol = plan.currencySymbol || '₹';
          const priceKw = plan.pricePerKw !== undefined ? plan.pricePerKw : (plan.pricePerKW || 0);
          const activeCount = plan.subscribersCount !== undefined ? plan.subscribersCount : (plan.activeContracts || 0);

          return (
            <div
              key={plan.id || plan._id || plan.planId}
              className={`card border-2 ${planColorMap[plan.id] || 'border-border'} hover:shadow-card-md transition-all duration-200 flex flex-col`}
            >
              <div className="p-5 flex-1">
                {/* Header with Title, Badges & Country Tag */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-navy text-base">{plan.name}</h3>
                      {plan.isBestSeller && <span className="text-xxs bg-solar text-white px-1.5 py-0.5 rounded font-bold">POPULAR</span>}
                      {plan.isPremium && <Star size={14} className="text-solar fill-solar" />}
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge status={plan.status || 'active'} size="xs" dot />
                      {/* Country Tag Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border border-gray-200 text-xxs font-bold">
                        <span>{flagEmoji}</span>
                        <span>{countryName}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mb-4">{plan.description}</p>

                {/* Price */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xxs text-text-muted uppercase tracking-wider mb-1">
                    BASE PRICE ({countryName.toUpperCase()})
                  </p>
                  <p className="text-2xl font-extrabold text-navy">
                    {symbol}{plan.basePrice >= 1000 ? `${(plan.basePrice / 1000).toFixed(0)}K` : plan.basePrice}
                    <span className="text-sm font-normal text-text-secondary">/year</span>
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {symbol}{priceKw}/kWp/year
                  </p>
                </div>

                {/* Key info */}
                <div className="space-y-2 mb-4">
                  {[
                    { label: 'PM Visits', value: plan.visitFrequency },
                    { label: 'Cleaning', value: plan.cleaningFrequency },
                    { label: 'Duration', value: plan.contractDuration },
                    { label: 'SLA Response', value: slaResp },
                    { label: 'Billing', value: plan.billing },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-text-secondary">{item.label}</span>
                      <span className="font-medium text-navy capitalize">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Services */}
                <div className="space-y-1.5">
                  {servicesList.map((svc, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-success shrink-0 mt-0.5" />
                      <span className="text-xs text-text-secondary">{svc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border bg-gray-50 rounded-b-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-navy">{activeCount}</span>
                    <span className="text-xs text-text-secondary ml-1">active contracts</span>
                  </div>
                  <Badge status={plan.status || "active"} size="xs" dot />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
