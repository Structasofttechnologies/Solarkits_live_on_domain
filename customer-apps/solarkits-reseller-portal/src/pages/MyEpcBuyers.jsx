import { useState, useEffect } from "react";
import api from "../services/api";
import { FiUsers, FiPlus, FiCheckCircle, FiClock, FiXCircle, FiLoader, FiMail, FiPhone } from "react-icons/fi";

export default function MyEpcBuyers() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    name:         "",
    email:        "",
    whatsapp:     "",
    company_name: "",
    password:     "",
    state_id:     "",
    district_id:  "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchBuyers = () => {
    setLoading(true);
    api.get('/india/v1/reseller/epc-buyers/list')
      .then((res) => { if (res.data?.status === "success") setBuyers(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBuyers();
  }, []);

  const handleRegisterEpc = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await api.post('/india/v1/reseller/epc-buyers/register', form);
      if (res.data?.status === "success") {
        alert("EPC Buyer sub-account registered! Sent for admin approval.");
        setModal(false);
        setForm({ name: "", email: "", whatsapp: "", company_name: "", password: "", state_id: "", district_id: "" });
        fetchBuyers();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FiUsers className="text-blue-600" size={28} />
            My Onboarded EPC Buyers
          </h1>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Register and manage EPC buyer sub-accounts within your authorized territory
          </p>
        </div>

        <button
          onClick={() => setModal(true)}
          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/30 cursor-pointer"
        >
          <FiPlus size={18} /> Register New EPC Buyer
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 font-bold gap-2">
            <FiLoader className="animate-spin text-blue-600" size={24} /> Loading onboarded EPC buyers...
          </div>
        ) : buyers.length === 0 ? (
          <div className="py-20 text-center text-slate-600 text-sm font-semibold">
            No EPC buyers onboarded yet. Click "Register New EPC Buyer" to add sub-accounts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">EPC Account Name</th>
                  <th className="text-left text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Contact Email</th>
                  <th className="text-left text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">WhatsApp</th>
                  <th className="text-center text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {buyers.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-900">{b.name}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium"><FiMail className="inline mr-1.5 text-slate-400" size={14} /> {b.email}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium"><FiPhone className="inline mr-1.5 text-slate-400" size={14} /> {b.whatsapp}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold capitalize ${
                        b.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : b.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {b.status === 'approved' ? <FiCheckCircle size={13} /> : b.status === 'pending' ? <FiClock size={13} /> : <FiXCircle size={13} />}
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-300 p-8 w-full max-w-lg space-y-5 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">Register EPC Buyer Sub-Account</h3>

            {error && <div className="p-3.5 rounded-xl bg-red-100 text-red-800 text-xs font-bold border border-red-300">{error}</div>}

            <form onSubmit={handleRegisterEpc} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Sunil Mehta"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Company / Firm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Mehta Solar Infra"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="sunil@mehta.in"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">WhatsApp Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="9812345678"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ backgroundColor: '#2563eb', color: '#ffffff' }} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 cursor-pointer shadow-md shadow-blue-500/30">
                  Submit EPC Buyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
