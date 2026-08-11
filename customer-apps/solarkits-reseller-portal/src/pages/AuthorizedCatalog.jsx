import { useState, useEffect } from "react";
import api from "../services/api";
import { FiPackage, FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";

export default function AuthorizedCatalog() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/india/v1/reseller/authorized-products')
      .then((res) => { if (res.data?.status === "success") setRules(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <FiPackage className="text-blue-600" size={28} />
          Authorized Catalog & Product Matrix
        </h1>
        <p className="text-sm font-medium text-slate-600 mt-1">
          Explore product categories and solar kits authorized for your partner account
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 font-bold gap-2">
            <FiLoader className="animate-spin text-blue-600" size={24} /> Loading product authorization matrix...
          </div>
        ) : rules.length === 0 ? (
          <div className="py-20 text-center text-slate-600 text-sm font-semibold">
            All standard catalog categories and solar kits are available under your active plan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Scope Level</th>
                  <th className="text-left text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Target Entity</th>
                  <th className="text-center text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Authorization Mode</th>
                  <th className="text-center text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Rule Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rules.map((r) => {
                  const targetName = r.category?.name || r.subcategory?.name || r.product?.name || r.kit?.kit_name || "All Catalog Items";
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 capitalize">{r.scope_type}</td>
                      <td className="px-6 py-4 font-black text-blue-600">{targetName}</td>
                      <td className="px-6 py-4 text-center">
                        {r.is_authorized ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                            <FiCheckCircle size={13} /> Authorized (Whitelist)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-extrabold">
                            <FiXCircle size={13} /> Restricted (Blacklist)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-mono font-bold text-slate-600 capitalize">
                        {r.source}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
