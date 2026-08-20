 const FRANCHISE_PLANS = [
  {
    level: "District",
    name: "District  Frachisee",
    price: "₹25,000",
    period: "One-time onboarding",
    territory: "1 Exclusive District",
    earnings: "15%–20% Margin",
    badge: "Start Local",
    features: [
      "Verified local leads",
      "Demo and branding kit",
      "Factory-direct supply",
      "Technical sales support",
    ],
    buttonText: "Reserve District",
    planCode: "DISTRICT_DEALER",
  },
  {
    level: "State",
    name: "State Frachisee",
    price: "₹2,50,000",
    period: "Initial partnership fee",
    territory: "Full State Rights",
    earnings: "Wholesale + 3% Override",
    badge: "Most Popular",
    features: [
      "State-wide exclusivity",
      "Sub-dealer network rights",
      "Priority stock dispatch",
      "Dedicated growth manager",
    ],
    buttonText: "Apply for State Rights",
    planCode: "STATE_DISTRIBUTOR",
    popular: true,
  },
  {
    level: "Country",
    name: "Master Franchise",
    price: "Custom",
    period: "Based on market evaluation",
    territory: "National Exclusivity",
    earnings: "Master Margin + Royalty",
    badge: "Enterprise",
    features: [
      "Country-wide franchise license",
      "Distributor appointment rights",
      "Co-branded market launch",
      "Direct leadership support",
    ],
    buttonText: "Request Country Review",
    planCode: "COUNTRY_MASTER",
  },
];

export default function FranchiseOpportunity({ onOpenLeadModal }) {
  const handlePlanClick = (plan) => {
    if (typeof onOpenLeadModal === "function") {
      onOpenLeadModal(
        {
          preferredModel: plan.name,
          requiredConfig: plan.planCode,
          territoryLevel: plan.level,
          investment: plan.price,
        },
        "franchise_apply"
      );
    }
  };

  return (
    <section
      id="franchise-plans"
      className="relative overflow-hidden border-t border-slate-200 bg-slate-50 py-16 text-slate-900 sm:py-24"
    >
      {/* Background Decoration */}
      <div className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-[#0575B8]/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-[#F49222]/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#F49222]" />

            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D97E15] sm:text-xs">
              Franchise Territory Opportunity
            </span>
          </div>

          <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
            Choose Your{" "}
            <span className="text-[#0575B8]">Solar Territory</span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Start at district level or lead an entire market with protected
            territory, factory pricing and complete business support.
          </p>
        </div>

        {/* Plans */}
        <div className="mt-10 grid grid-cols-1 items-stretch gap-6 lg:mt-14 lg:grid-cols-3">
          {FRANCHISE_PLANS.map((plan) => (
            <article
              key={plan.planCode}
              className={`group relative flex flex-col overflow-hidden rounded-[28px] bg-white transition duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "border-2 border-[#0575B8] shadow-xl shadow-blue-900/10 lg:-translate-y-3 lg:hover:-translate-y-4"
                  : "border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-900/5"
              }`}
            >
              {plan.popular && (
                <div className="bg-[#0575B8] py-2 text-center text-[10px] font-black uppercase tracking-[0.18em] text-white">
                  Recommended Growth Plan
                </div>
              )}

              <div className="flex flex-1 flex-col p-6 sm:p-7">
                {/* Plan Name */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D97E15]">
                      {plan.level} Level
                    </p>

                    <h3 className="mt-1 text-xl font-black text-slate-900">
                      {plan.name}
                    </h3>
                  </div>

                  <span
                    className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                      plan.popular
                        ? "border-blue-200 bg-blue-50 text-[#0575B8]"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>

                {/* Pricing */}
                <div className="mt-6 border-b border-slate-100 pb-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Investment
                  </p>

                  <span className="mt-1 block text-3xl font-black tracking-tight text-slate-950">
                    {plan.price}
                  </span>

                  <p className="mt-1 text-xs text-slate-500">
                    {plan.period}
                  </p>
                </div>

                {/* Territory and Earnings */}
                <div className="grid grid-cols-2 gap-3 py-5">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Territory
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-800">
                      {plan.territory}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#0575B8]/70">
                      Earning
                    </p>

                    <p className="mt-1 text-sm font-black text-[#0575B8]">
                      {plan.earnings}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-3 border-t border-slate-100 pt-5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-sm font-medium text-slate-600"
                    >
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-[11px] font-black text-emerald-600">
                        ✓
                      </span>

                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  type="button"
                  onClick={() => handlePlanClick(plan)}
                  className={`mt-7 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-xs font-black uppercase tracking-wider text-white transition focus:outline-none focus:ring-4 focus:ring-blue-200 ${
                    plan.popular
                      ? "bg-gradient-to-r from-[#0575B8] to-[#1965B0] shadow-md shadow-blue-500/20 hover:from-[#045D93] hover:to-[#0575B8]"
                      : "bg-[#0575B8] hover:bg-[#045D93]"
                  }`}
                >
                  <span>{plan.buttonText}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Trust Points */}
        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
          <span>✓ Protected territory</span>
          <span>✓ Factory-direct pricing</span>
          <span>✓ Sales and technical training</span>
        </div>
      </div>
    </section>
  );
}