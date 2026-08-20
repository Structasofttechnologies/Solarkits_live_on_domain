import { useMemo, useState } from "react";
import {
  FiArrowRight,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiGlobe,
  FiMap,
  FiMapPin,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";
import { INDIAN_STATES_DISTRICTS } from "../data/territoryData";

const LEVELS = {
  district: {
    label: "District",
    title: "District Dealer",
    price: "₹25,000",
    period: "one-time onboarding",
    earning: "15%–20% margin",
    territory: "1 exclusive district",
    code: "DISTRICT_DEALER",
    description: "Best for local dealers and contractors ready to grow in one focused market.",
    benefits: ["Verified local leads", "Factory-direct supply", "Demo & branding kit", "Technical sales support"],
  },
  state: {
    label: "State",
    title: "State Distributor",
    price: "₹2,50,000",
    period: "initial partnership fee",
    earning: "Wholesale + 3% override",
    territory: "Full state rights",
    code: "STATE_DISTRIBUTOR",
    description: "Built for established teams that can develop and manage a dealer network.",
    benefits: ["State-wide exclusivity", "Sub-dealer appointment rights", "Priority stock dispatch", "Dedicated growth manager"],
  },
  country: {
    label: "Country",
    title: "Master Franchise",
    price: "Custom",
    period: "market evaluation required",
    earning: "Master margin + royalty",
    territory: "National exclusivity",
    code: "COUNTRY_MASTER",
    description: "Designed for large distributors with national operations and leadership capacity.",
    benefits: ["Country-wide license", "Distributor network rights", "Co-branded market launch", "Direct leadership support"],
  },
};

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export default function EligibilityChecker({ onOpenLeadModal }) {
  const states = Object.keys(INDIAN_STATES_DISTRICTS);
  const initialState = states[0] || "Maharashtra";

  const [formData, setFormData] = useState({
    gstin: "",
    businessType: "Solar EPC / Installer",
    experience: "1-3",
    investment: "5-15",
    teamSize: "2-5",
    level: "district",
    country: "India",
    state: initialState,
    district: (INDIAN_STATES_DISTRICTS[initialState] || [""])[0],
  });
  const [touched, setTouched] = useState(false);

  const gstin = formData.gstin.trim().toUpperCase();
  const gstinValid = GSTIN_PATTERN.test(gstin);
  const selectedPlan = LEVELS[formData.level];

  const profileMatch = useMemo(() => {
    let score = 55;
    if (gstinValid) score += 10;
    if (formData.experience === "3+") score += 10;
    if (formData.investment === "15+") score += 15;
    else if (formData.investment === "5-15") score += 10;
    if (formData.teamSize === "10+") score += 10;
    else if (formData.teamSize === "2-5" || formData.teamSize === "6-10") score += 6;
    return Math.min(score, 98);
  }, [formData.experience, formData.investment, formData.teamSize, gstinValid]);

  const qualification = useMemo(() => {
    if (formData.level === "district") return { ready: gstinValid, text: gstinValid ? "Strong profile for district dealership" : "Enter a valid GSTIN to qualify" };
    if (formData.level === "state") {
      const ready = gstinValid && ["5-15", "15+"].includes(formData.investment) && formData.teamSize !== "solo";
      return { ready, text: ready ? "Profile fits state distribution" : "State plan needs ₹5L+ capacity and a team" };
    }
    const ready = gstinValid && formData.investment === "15+" && ["6-10", "10+"].includes(formData.teamSize) && formData.experience === "3+";
    return { ready, text: ready ? "Eligible for country-level review" : "Country plan needs ₹15L+, 3+ years and a larger team" };
  }, [formData, gstinValid]);

  const locationText = formData.level === "district"
    ? `${formData.district}, ${formData.state}`
    : formData.level === "state"
      ? formData.state
      : formData.country;

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleStateChange = (state) => {
    setFormData((current) => ({
      ...current,
      state,
      district: (INDIAN_STATES_DISTRICTS[state] || [""])[0],
    }));
  };

  const handleSubmit = () => {
    setTouched(true);
    if (!gstinValid) return;
    if (typeof onOpenLeadModal === "function") {
      onOpenLeadModal({
        gstin,
        state: formData.state,
        district: formData.district,
        country: formData.country,
        territoryLevel: selectedPlan.label,
        preferredModel: selectedPlan.title,
        requiredConfig: `${selectedPlan.code} | ${locationText} | Match ${profileMatch}%`,
      }, "franchise_apply");
    }
  };

  const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0575B8] focus:ring-4 focus:ring-blue-100";

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-14 text-slate-900 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
            <FiShield className="text-[#F49222]" size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D97E15]">Franchise Recommendation</span>
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-4xl">Find Your Best <span className="text-[#0575B8]">Franchise Level</span></h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">Fill your business details on the left. Your matching territory plan updates instantly on the right.</p>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#0575B8]">Your profile</p>
                <h3 className="mt-1 text-xl font-black">Business & territory details</h3>
              </div>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase text-[#D97E15]">GSTIN Required</span>
            </div>

            <div className="mt-6">
              <label htmlFor="gstin" className="text-xs font-bold uppercase tracking-wider text-slate-700">GSTIN <span className="text-red-500">*</span></label>
              <div className="relative">
                <input id="gstin" maxLength={15} value={formData.gstin} onBlur={() => setTouched(true)} onChange={(e) => updateField("gstin", e.target.value.toUpperCase().replace(/\s/g, ""))} placeholder="22AAAAA0000A1Z5" className={`${inputClass} pr-11 uppercase ${touched && !gstinValid ? "border-red-400 focus:border-red-500 focus:ring-red-100" : gstinValid ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100" : ""}`} aria-invalid={touched && !gstinValid} />
                {gstinValid && <FiCheckCircle className="absolute right-3.5 top-1/2 mt-1 text-emerald-600" size={19} />}
              </div>
              <p className={`mt-1.5 text-[11px] ${touched && !gstinValid ? "text-red-600" : "text-slate-500"}`}>{touched && !gstinValid ? "Enter a valid 15-character GSTIN. GSTIN is compulsory." : "GSTIN is securely used only for franchise eligibility verification."}</p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Business type
                <select value={formData.businessType} onChange={(e) => updateField("businessType", e.target.value)} className={inputClass}>
                  <option>Solar EPC / Installer</option><option>Electrical Goods Dealer</option><option>Battery & Inverter Shop</option><option>Real Estate / Contractor</option><option>New Entrepreneur</option>
                </select>
              </label>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Industry experience
                <select value={formData.experience} onChange={(e) => updateField("experience", e.target.value)} className={inputClass}>
                  <option value="0-1">0–1 Year</option><option value="1-3">1–3 Years</option><option value="3+">3+ Years</option>
                </select>
              </label>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Investment capacity
                <select value={formData.investment} onChange={(e) => updateField("investment", e.target.value)} className={inputClass}>
                  <option value="2-5">₹2L–₹5L</option><option value="5-15">₹5L–₹15L</option><option value="15+">₹15L+</option>
                </select>
              </label>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Sales / operations team
                <select value={formData.teamSize} onChange={(e) => updateField("teamSize", e.target.value)} className={inputClass}>
                  <option value="solo">Solo operator</option><option value="2-5">2–5 Members</option><option value="6-10">6–10 Members</option><option value="10+">10+ Members</option>
                </select>
              </label>
            </div>

            <fieldset className="mt-6">
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-700">Choose territory level</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {Object.entries(LEVELS).map(([key, plan]) => {
                  const Icon = key === "district" ? FiMapPin : key === "state" ? FiMap : FiGlobe;
                  const active = formData.level === key;
                  return <button key={key} type="button" onClick={() => updateField("level", key)} className={`rounded-xl border p-3 text-left transition ${active ? "border-[#0575B8] bg-blue-50 text-[#0575B8] ring-2 ring-blue-100" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"}`}><Icon size={18} /><span className="mt-2 block text-xs font-black">{plan.label}</span></button>;
                })}
              </div>
            </fieldset>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {formData.level === "country" ? (
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 sm:col-span-2">Target country
                  <select value={formData.country} onChange={(e) => updateField("country", e.target.value)} className={inputClass}><option>India</option></select>
                </label>
              ) : (
                <>
                  <label className={`text-xs font-bold uppercase tracking-wider text-slate-700 ${formData.level === "state" ? "sm:col-span-2" : ""}`}>State
                    <select value={formData.state} onChange={(e) => handleStateChange(e.target.value)} className={inputClass}>{states.map((state) => <option key={state}>{state}</option>)}</select>
                  </label>
                  {formData.level === "district" && <label className="text-xs font-bold uppercase tracking-wider text-slate-700">District
                    <select value={formData.district} onChange={(e) => updateField("district", e.target.value)} className={inputClass}>{(INDIAN_STATES_DISTRICTS[formData.state] || []).map((district) => <option key={district}>{district}</option>)}</select>
                  </label>}
                </>
              )}
            </div>
          </div>

          <aside className="overflow-hidden rounded-3xl border-2 border-[#0575B8] bg-white shadow-xl shadow-blue-900/10 lg:sticky lg:top-6">
            <div className="flex items-center justify-between bg-[#0575B8] px-5 py-3 text-white">
              <span className="text-[10px] font-black uppercase tracking-[0.16em]">Live Recommendation</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold">{profileMatch}% Profile Match</span>
            </div>
            <div className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-black uppercase tracking-wider text-[#D97E15]">{selectedPlan.label} Level</p><h3 className="mt-1 text-2xl font-black">{selectedPlan.title}</h3></div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0575B8]"><FiBriefcase size={21} /></div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{selectedPlan.description}</p>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Investment</p><p className="mt-1 text-3xl font-black">{selectedPlan.price}</p></div><p className="pb-1 text-right text-xs text-slate-500">{selectedPlan.period}</p></div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4"><div><p className="text-[10px] font-bold uppercase text-slate-400">Territory</p><p className="mt-1 text-xs font-black text-slate-800">{locationText}</p></div><div><p className="text-[10px] font-bold uppercase text-slate-400">Earning</p><p className="mt-1 text-xs font-black text-[#0575B8]">{selectedPlan.earning}</p></div></div>
              </div>

              <div className={`mt-4 flex items-start gap-3 rounded-2xl border p-3.5 ${qualification.ready ? "border-emerald-200 bg-emerald-50" : "border-orange-200 bg-orange-50"}`}>
                {qualification.ready ? <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-600" /> : <FiTrendingUp className="mt-0.5 shrink-0 text-[#D97E15]" />}
                <div><p className={`text-xs font-black ${qualification.ready ? "text-emerald-800" : "text-orange-800"}`}>{qualification.ready ? "Recommended for your profile" : "Profile improvement suggested"}</p><p className="mt-0.5 text-[11px] text-slate-600">{qualification.text}</p></div>
              </div>

              <ul className="mt-5 space-y-3">{selectedPlan.benefits.map((benefit) => <li key={benefit} className="flex items-center gap-3 text-sm font-medium text-slate-600"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><FiCheck size={12} strokeWidth={3} /></span>{benefit}</li>)}</ul>

              <button type="button" onClick={handleSubmit} disabled={!gstinValid} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0575B8] to-[#1965B0] px-4 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/20 transition hover:from-[#045D93] hover:to-[#0575B8] disabled:cursor-not-allowed disabled:opacity-45">Apply for {selectedPlan.label} Franchise <FiArrowRight /></button>
              {!gstinValid && <p className="mt-2 text-center text-[11px] font-medium text-slate-500">Enter a valid GSTIN to enable application</p>}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
