import { useState, useEffect } from "react";
import api from "../services/api";
import {
  FiCreditCard,
  FiDollarSign,
  FiClock,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiCheckCircle,
  FiLoader,
  FiPlus,
} from "react-icons/fi";

export default function WalletPortal() {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    amount:              "",
    bank_name:           "",
    account_number:      "",
    ifsc_code:           "",
    account_holder_name: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = () => {
    setLoading(true);
    // Wallet Balance
    api.get('/india/v1/reseller/wallet/me')
      .then((res) => { if (res.data?.status === "success") setWallet(res.data.data); })
      .catch(() => {});

    // Ledger Audit Trail
    api.get('/india/v1/reseller/wallet/ledger')
      .then((res) => { if (res.data?.status === "success") setLedger(res.data.data); })
      .catch(() => {});

    // Payout Requests
    api.get('/india/v1/reseller/wallet/payouts')
      .then((res) => { if (res.data?.status === "success") setPayouts(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await api.post('/india/v1/reseller/wallet/withdraw', form);
      if (res.data?.status === "success") {
        alert("Payout withdrawal request submitted successfully!");
        setModal(false);
        setForm({ amount: "", bank_name: "", account_number: "", ifsc_code: "", account_holder_name: "" });
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Withdrawal request failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FiCreditCard className="text-blue-600" size={28} />
            My Wallet & Payout Withdrawals
          </h1>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Real-time wallet balance breakdown, double-entry audit ledgers, and withdrawal payouts
          </p>
        </div>

        <button
          onClick={() => setModal(true)}
          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/30 cursor-pointer"
        >
          <FiPlus size={18} /> Request Withdrawal
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <FiDollarSign size={26} />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Available Balance</div>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{(wallet?.available_balance || 0).toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <FiClock size={26} />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Pending Holds</div>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{(wallet?.pending_balance || 0).toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <FiArrowUpRight size={26} />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Earned</div>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{(wallet?.total_earned || 0).toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <FiArrowDownLeft size={26} />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Withdrawn</div>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{(wallet?.total_withdrawn || 0).toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      {/* Ledger History Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
          Double-Entry Transaction Ledger History
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-500 font-bold gap-2">
            <FiLoader className="animate-spin text-blue-600" size={20} /> Loading ledger entries...
          </div>
        ) : ledger.length === 0 ? (
          <div className="py-12 text-center text-slate-600 text-sm font-semibold">No transactions recorded yet in ledger.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-slate-700 font-extrabold px-4 py-3 uppercase tracking-wider">Transaction Type</th>
                  <th className="text-left text-slate-700 font-extrabold px-4 py-3 uppercase tracking-wider">Narration</th>
                  <th className="text-right text-slate-700 font-extrabold px-4 py-3 uppercase tracking-wider">Amount</th>
                  <th className="text-right text-slate-700 font-extrabold px-4 py-3 uppercase tracking-wider">Balance After</th>
                  <th className="text-right text-slate-700 font-extrabold px-4 py-3 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ledger.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold capitalize text-blue-600">{l.transaction_type.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-slate-700">{l.narration}</td>
                    <td className={`px-4 py-3 text-right font-black ${l.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {l.amount >= 0 ? `+₹${l.amount.toLocaleString("en-IN")}` : `-₹${Math.abs(l.amount).toLocaleString("en-IN")}`}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">₹{(l.balance_after || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{new Date(l.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Request Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-300 p-8 w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">Request Payout Withdrawal</h3>

            {error && <div className="p-3.5 rounded-xl bg-red-100 text-red-800 text-xs font-bold border border-red-300">{error}</div>}

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Withdrawal Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="5000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Bank Name *</label>
                <input
                  type="text"
                  required
                  placeholder="HDFC Bank"
                  value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Account Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="50100123456789"
                    value={form.account_number}
                    onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="HDFC0001234"
                    value={form.ifsc_code}
                    onChange={(e) => setForm({ ...form, ifsc_code: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Apex Solar Energy Pvt Ltd"
                  value={form.account_holder_name}
                  onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ backgroundColor: '#2563eb', color: '#ffffff' }} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 cursor-pointer shadow-md shadow-blue-500/30">
                  Submit Payout Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
