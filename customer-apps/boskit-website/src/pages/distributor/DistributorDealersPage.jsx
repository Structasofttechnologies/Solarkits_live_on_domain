import React, { useState, useEffect } from 'react';
import { FiUsers, FiSearch, FiPlusCircle, FiRefreshCw, FiCheckCircle, FiShield } from 'react-icons/fi';
import api from '../../services/api';

export default function DistributorDealersPage() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ business_name: '', email: '', mobile: '' });
  const [inviteResult, setInviteResult] = useState(null);
  const [inviting, setInviting] = useState(false);

  const fetchDealers = () => {
    setLoading(true);
    api
      .get('/distributor/dealers', {
        params: { search: search || undefined },
      })
      .then((res) => {
        if (res.data?.success) setDealers(res.data.dealers || []);
      })
      .catch((err) => console.error('Error loading dealers:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDealers();
  }, [search]);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    try {
      setInviting(true);
      const res = await api.post('/distributor/dealers/invite', inviteForm);
      if (res.data?.success) {
        setInviteResult(res.data);
        setInviteForm({ business_name: '', email: '', mobile: '' });
        fetchDealers();
      }
    } catch (err) {
      console.error('Invite error:', err);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#0F172A]">
            Sub-Dealer & Installer Network
          </h1>
          <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
            Manage local solar installers and EPC buyers procuring solar equipment under your district distributor network.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowInviteModal(true);
              setInviteResult(null);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0575B8] hover:bg-[#045D93] text-white shadow-xs flex items-center gap-2"
          >
            <FiPlusCircle size={16} /> Onboard New Dealer
          </button>
          <button
            onClick={fetchDealers}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] flex items-center gap-2"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dealer by name, dealer code, mobile..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-[#475569] focus:border-[#0575B8] focus:outline-none"
          />
        </div>
        <span className="text-xs text-[#475569] font-semibold hidden sm:inline">
          {dealers.length} Dealers in Network
        </span>
      </div>

      {/* Dealers Roster Table */}
      <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#0F172A]">
            <thead className="bg-[#F8FAFC] text-[#475569] font-bold uppercase text-[10px] border-b border-[#E2E8F0]">
              <tr>
                <th className="p-3.5">Dealer Name</th>
                <th className="p-3.5">Dealer Code</th>
                <th className="p-3.5">GSTIN</th>
                <th className="p-3.5">Monthly Volume</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#475569]">
                    Loading dealers...
                  </td>
                </tr>
              ) : dealers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#475569]">
                    No sub-dealers onboarded yet. Click "Onboard New Dealer" to invite local installers.
                  </td>
                </tr>
              ) : (
                dealers.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-[#0F172A] text-sm">{d.business_name}</div>
                      <div className="text-[11px] text-[#475569]">{d.email} • {d.mobile}</div>
                    </td>
                    <td className="p-3.5 font-mono text-[#0575B8] font-bold">
                      {d.dealer_code}
                    </td>
                    <td className="p-3.5 font-mono text-[#0F172A]">
                      {d.gst_number}
                    </td>
                    <td className="p-3.5 font-bold text-[#0F172A]">
                      {d.monthly_volume_kw} kW
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          d.activation_status === 'active'
                            ? 'bg-[#EFF8FF] text-[#0575B8] border border-[#E2E8F0]'
                            : 'bg-[#FFF7ED] text-[#9A7300] border border-[#F4922240]'
                        }`}
                      >
                        {d.activation_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#475569]">
                      {new Date(d.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── INVITE MODAL ────────────────────────────────────────────────────── */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-lg text-[#0F172A]">Onboard New Solar Dealer</h3>
            <p className="text-xs text-[#475569]">
              Invite a local installer or EPC contractor to procure wholesale equipment under your hub.
            </p>

            {inviteResult ? (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#EFF8FF] border border-[#E2E8F0] text-xs text-[#0575B8] space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <FiCheckCircle className="text-[#0575B8]" /> Invitation Dispatched!
                  </div>
                  <div>An official invitation link was emailed to the dealer.</div>
                  <div className="p-2 rounded bg-[#FFFFFF] font-mono text-[11px] text-[#0575B8] border border-[#E2E8F0] break-all select-all">
                    {inviteResult.invite_link}
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#0575B8] text-white hover:bg-[#045D93]"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">Dealer Enterprise Name *</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.business_name}
                    onChange={(e) => setInviteForm({ ...inviteForm, business_name: e.target.value })}
                    placeholder="e.g. Gujarat Solar Power EPC"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] focus:border-[#0575B8] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">Dealer Email *</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="dealer@solarpower.in"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] focus:border-[#0575B8] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">Dealer Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={inviteForm.mobile}
                    onChange={(e) => setInviteForm({ ...inviteForm, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] focus:border-[#0575B8] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:bg-[#EFF8FF] hover:text-[#0F172A]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0575B8] text-white hover:bg-[#045D93]"
                  >
                    {inviting ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
