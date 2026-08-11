import { useState, useEffect } from "react";
import api from "../services/api";
import { FiMapPin, FiCheckCircle, FiLoader } from "react-icons/fi";

export default function MyTerritories() {
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/india/v1/reseller/territories')
      .then((res) => { if (res.data?.status === "success") setTerritories(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <FiMapPin className="text-blue-600" size={28} />
          My Authorized Geographic Scope
        </h1>
        <p className="text-sm font-medium text-slate-600 mt-1">
          View your authorized sales districts, states, and precedence assignment sources
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 font-bold gap-2">
            <FiLoader className="animate-spin text-blue-600" size={24} /> Loading territory authorizations...
          </div>
        ) : territories.length === 0 ? (
          <div className="py-20 text-center text-slate-600 text-sm font-semibold">
            No explicit territory restrictions assigned. You are authorized under your registered GST state default.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Scope Level</th>
                  <th className="text-left text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Geographic Entity</th>
                  <th className="text-center text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Precedence Source</th>
                  <th className="text-center text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {territories.map((t) => {
                  const scopeLevel = t.scope_level || t.territory_level || 'district';
                  const locationName = t.location_name || (t.district?.name ? (t.state?.name ? `${t.district.name}, ${t.state.name}` : t.district.name) : t.state?.name || t.country?.name || 'All Locations');
                  const precedenceSource = (t.precedence_source || t.source || 'Admin Assigned').replace(/_/g, ' ');

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 capitalize">{scopeLevel}</td>
                      <td className="px-6 py-4 font-black text-blue-600">{locationName}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-black capitalize">
                          {precedenceSource}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                          <FiCheckCircle size={13} /> Active
                        </span>
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
