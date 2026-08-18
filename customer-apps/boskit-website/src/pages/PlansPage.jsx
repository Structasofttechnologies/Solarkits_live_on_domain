import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiX, FiArrowRight, FiShield, FiHelpCircle, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/public/plans');
      if (res.data?.plans) {
        setPlans(res.data.plans);
      }
    } catch (err) {
      console.error('Error fetching distributor plans:', err);
      setError('Failed to load distributor plans. Please refresh or try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 bg-[#FFFFFF]">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1] inline-block shadow-xs">
          FY 2026-27 Distributor Allocation
        </span>
        <h1 className="font-heading font-black text-4xl sm:text-5xl text-[#17211B] tracking-tight">
          Territorial Distributor Plans
        </h1>
        <p className="text-base text-[#5F6F65] max-w-2xl mx-auto">
          Every SolarKits BOS Distributor tier comes with guaranteed legal territory lock, direct wholesale margins, and sub-dealer network controls.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadPlans}
            className="px-3 py-1 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center gap-1"
          >
            <FiRefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Plan Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-[#FFFFFF] border border-[#DDE8E1] h-96 rounded-3xl animate-pulse shadow-xs" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="p-12 text-center bg-[#F7FAF8] border border-[#DDE8E1] rounded-3xl space-y-2">
          <h3 className="font-bold text-base text-[#17211B]">No Distributor Plans Currently Active</h3>
          <p className="text-xs text-[#5F6F65]">Please check back soon or contact regional distribution support.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id || plan.plan_code}
              className={`rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-300 ${
                plan.is_popular
                  ? 'bg-[#FFFFFF] border-2 border-[#1F8F4E] shadow-xl scale-[1.03]'
                  : 'bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs hover:shadow-md hover:border-[#1F8F4E]/40'
              }`}
            >
              {plan.is_popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#F5B700] text-[#17211B] shadow-xs">
                  {plan.badge_text || "Most Popular Distributor Plan"}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="font-heading font-bold text-2xl text-[#17211B]">{plan.name}</h3>
                  <p className="text-xs text-[#5F6F65] mt-2 leading-relaxed">{plan.short_description || plan.description}</p>
                </div>

                <div className="pt-3 pb-5 border-y border-[#DDE8E1]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-[#5F6F65] font-medium">Joining Fee:</span>
                    <span className="font-heading font-black text-3xl text-[#1F8F4E]">
                      ₹{(plan.joining_fee_inr || 25000).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#5F6F65] mt-2">
                    <span>Renewal: <strong className="text-[#17211B]">₹{(plan.renewal_fee_inr || 10000).toLocaleString('en-IN')}</strong></span>
                    <span>Validity: <strong className="text-[#17211B]">{plan.validity_display || `${plan.validity_value || 12} Months`}</strong></span>
                  </div>
                  <div className="text-[11px] text-[#5F6F65] mt-1.5">
                    Territory: <strong className="text-[#17211B]">{plan.allowed_territories_count || 1} {plan.territory_type || plan.territory_level || 'District'} ({plan.is_territory_exclusive ? 'Exclusive Lock' : 'Shared'})</strong>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-heading font-bold text-xs text-[#17211B] uppercase tracking-wider">Included Privileges:</h4>
                  <ul className="space-y-2.5 text-xs text-[#17211B]">
                    {(plan.benefits || plan.features)?.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2">
                        <FiCheckCircle className="w-4 h-4 text-[#1F8F4E] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  to={`/distributor/onboarding?plan=${plan.plan_code}`}
                  className={`w-full py-3.5 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2 transition-all ${
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
      )}

      {/* FAQ / Guarantee Box */}
      <div className="bg-[#FFFFFF] p-8 sm:p-10 rounded-3xl border border-[#DDE8E1] shadow-xs space-y-6">
        <h2 className="font-heading font-bold text-xl text-[#17211B] text-center">Frequently Asked Distributor Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#5F6F65]">
          <div className="p-4 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] space-y-1.5">
            <h4 className="font-bold text-[#17211B] text-sm">How is territorial exclusivity enforced?</h4>
            <p className="text-[#5F6F65]">Our backend system enforces geo-fencing at the PIN code and District boundary level. No orders from other entities are fulfilled within an exclusive distributor's registered district.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] space-y-1.5">
            <h4 className="font-bold text-[#17211B] text-sm">When is the plan joining fee collected?</h4>
            <p className="text-[#5F6F65]">Plan fees are collected only after GST and KYC verification has been evaluated and approved by our regional onboarding committee.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
