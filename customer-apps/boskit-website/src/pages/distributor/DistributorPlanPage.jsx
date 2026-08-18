import React, { useState, useEffect } from 'react';
import { FiLayers, FiCheck, FiShield, FiClock, FiUsers, FiDollarSign, FiAward, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';

export default function DistributorPlanPage() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/distributor/plan')
      .then((res) => {
        if (res.data?.success) setPlan(res.data.plan);
      })
      .catch((err) => console.error('Plan fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-[#475569]">Loading distributor plan subscription details...</div>;
  }

  const maxDealers = plan?.max_dealers || 15;
  const activeDealers = plan?.active_dealers || 0;
  const utilizationPercent = Math.min(100, Math.round((activeDealers / maxDealers) * 100));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#0F172A]">
          Distributor Subscription Plan
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
          Overview of your active distributor plan tier, dealer seat quotas, and guaranteed territorial privileges.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0575B8] bg-[#EFF8FF] px-2.5 py-1 rounded border border-[#E2E8F0]">
              Active Distributor Subscription
            </span>
            <h2 className="font-heading font-black text-2xl text-[#0F172A] mt-2">{plan?.name}</h2>
            <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">{plan?.short_description || plan?.description}</p>
          </div>

          <div className="text-right">
            <div className="text-xs text-[#475569]">Distributor Joining Fee</div>
            <div className="font-heading font-black text-2xl text-[#0575B8]">
              ₹{(plan?.joining_fee_inr || 25000).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-[#475569] mt-0.5">
              Validity: <strong className="text-[#0F172A]">{plan?.validity_display || `${plan?.validity_value || 12} Months`}</strong>
            </div>
          </div>
        </div>

        {/* Seat Quota Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-[#0F172A]">
            <span>Sub-Dealer Seat Utilization</span>
            <span className="font-bold text-[#0575B8]">
              {activeDealers} / {maxDealers} Seats Assigned ({utilizationPercent}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden">
            <div
              className="h-full bg-[#0575B8] rounded-full transition-all duration-500"
              style={{ width: `${utilizationPercent}%` }}
            />
          </div>
          <div className="text-[11px] text-[#475569]">
            {plan?.remaining_dealer_seats !== undefined ? plan.remaining_dealer_seats : Math.max(0, maxDealers - activeDealers)} additional dealer seats available under your active tier.
          </div>
        </div>

        {/* Dynamic Benefits & Privileges */}
        <div className="space-y-3 pt-2">
          <h3 className="font-heading font-bold text-sm text-[#0F172A] uppercase tracking-wider">
            Active Entitlements & Privileges:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(plan?.benefits || [
              "Guaranteed District Territorial Exclusivity",
              "Sub-Dealer Onboarding & Account Management",
              "Full BOS Component Whitelist Access",
              "Direct Manufacturer Warranty Dispatch"
            ]).map((b, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2.5">
                <FiCheckCircle className="text-[#0575B8] mt-0.5 shrink-0" />
                <span className="text-xs font-medium text-[#0F172A]">{b}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
