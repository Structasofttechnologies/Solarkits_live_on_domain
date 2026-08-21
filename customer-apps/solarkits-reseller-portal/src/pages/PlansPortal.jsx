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
                  <div className="flex items-center gap-2 text-slate-800">
                    <FiCheckCircle className="text-emerald-600 shrink-0" size={16} />
                    <span>Territory Scope: <strong className="text-blue-700">{p.max_states_allowed || "District Level"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-800">
                    <FiCheckCircle className="text-emerald-600 shrink-0" size={16} />
                    <span>MOQ Capacity: <strong className="text-amber-600">Up to {Number(p.moq_capacity_kw || 10000).toLocaleString("en-IN")} kW</strong> ({p.moq_kits_count || 1} Kit MOQ)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-800">
                    <FiCheckCircle className="text-emerald-600 shrink-0" size={16} />
                    <span>Project Types: <strong className="text-slate-700">{p.project_types_display || p.moq_project_type || "All Project Types"}</strong></span>
                  </div>
                  {p.combo_kits_display && p.combo_kits_display !== "All Admin Combo Kits" && (
                    <div className="flex items-center gap-2 text-slate-800">
                      <FiCheckCircle className="text-emerald-600 shrink-0" size={16} />
                      <span>Combo Kits: <strong className="text-blue-700">{p.combo_kits_display}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-800">
                    <FiCheckCircle className="text-emerald-600 shrink-0" size={16} />
                    <span>Warehouse: <strong className="text-blue-700">{p.warehouse_required ? `${p.warehouse_count || 1} Hub (${Number(p.warehouse_space_sqft || 0).toLocaleString("en-IN")} sqft)` : "No WH Required"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-800">
                    <FiCheckCircle className="text-emerald-600 shrink-0" size={16} />
                    <span>Order Type: <strong className="text-purple-700">{p.order_type_allowed === "po_order" ? "PO Order Only" : p.order_type_allowed === "loose_order" ? "Loose Order Only" : "PO & Loose Orders"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-800">
                    <FiCheckCircle className="text-emerald-600 shrink-0" size={16} />
                    <span>Margins: <strong className="text-blue-700">{p.default_commission_rate}% Comm. / {p.default_dealer_margin}% Dealer Margin</strong></span>
                  </div>
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
