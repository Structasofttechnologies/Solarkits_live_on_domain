import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../services/api";
import { FiZap, FiCheckCircle, FiLoader } from "react-icons/fi";

export default function PlansPortal() {
  const { reseller } = useOutletContext();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/india/v1/reseller/plans/list')
      .then((res) => { if (res.data?.status === "success") setPlans(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId) => {
    try {
      const res = await api.post('/india/v1/reseller/plans/subscribe', { plan_id: planId });
      if (res.data?.status === "success") {
        alert("Subscription plan updated successfully!");
        window.location.reload();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Subscription failed");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <FiZap className="text-blue-600" size={28} />
          Franchisee Subscription Plans
        </h1>
        <p className="text-sm font-medium text-slate-600 mt-1">
          Explore partner pricing tiers, commission margins, and geographic territory limits
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 font-bold gap-2">
          <FiLoader className="animate-spin text-blue-600" size={24} /> Loading subscription plans...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.id} className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-extrabold text-slate-900">{p.plan_name}</h3>
                  {p.is_popular && (
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-wider">
                      Popular
                    </span>
                  )}
                </div>

                <div className="text-3xl font-black text-blue-600">
                  ₹{(p.annual_fee || 0).toLocaleString("en-IN")}<span className="text-xs text-slate-500 font-semibold"> / year</span>
                </div>

                <p className="text-xs text-slate-600 font-medium">{p.description || "Standard partner plan"}</p>

                <div className="space-y-2.5 text-xs font-bold pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-800"><FiCheckCircle className="text-emerald-600" size={16} /> Default Commission: <span className="text-blue-700">{p.default_commission_rate}%</span></div>
                  <div className="flex items-center gap-2 text-slate-800"><FiCheckCircle className="text-emerald-600" size={16} /> Dealer Margin: <span className="text-blue-700">{p.default_dealer_margin}%</span></div>
                  <div className="flex items-center gap-2 text-slate-800"><FiCheckCircle className="text-emerald-600" size={16} /> Max Territory States: <span className="text-blue-700">{p.max_states_allowed || "Unlimited"}</span></div>
                </div>
              </div>

              <button
                onClick={() => handleSubscribe(p.id)}
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-500/30 cursor-pointer"
              >
                Subscribe / Upgrade
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
