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
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#17211B]">
            Sub-Dealer & Installer Network
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6F65] mt-0.5">
            Manage local solar installers and EPC buyers procuring solar equipment under your district franchise.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowInviteModal(true);
              setInviteResult(null);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1F8F4E] hover:bg-[#18733E] text-white shadow-xs flex items-center gap-2"
          >
            <FiPlusCircle size={16} /> Onboard New Dealer
          </button>
          <button
            onClick={fetchDealers}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FFFFFF] hover:bg-[#F7FAF8] text-[#17211B] border border-[#DDE8E1] flex items-center gap-2"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6F65] w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dealer by name, dealer code, mobile..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] placeholder-[#5F6F65] focus:border-[#1F8F4E] focus:outline-none"
          />
        </div>
        <span className="text-xs text-[#5F6F65] font-semibold hidden sm:inline">
          {dealers.length} Dealers in Network
        </span>
      </div>

      {/* Dealers Roster Table */}
      <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#17211B]">
            <thead className="bg-[#F7FAF8] text-[#5F6F65] font-bold uppercase text-[10px] border-b border-[#DDE8E1]">
              <tr>
                <th className="p-3.5">Dealer Name</th>
                <th className="p-3.5">Dealer Code</th>
                <th className="p-3.5">GSTIN</th>
                <th className="p-3.5">Monthly Volume</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE8E1]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#5F6F65]">
                    Loading dealers...
                  </td>
                </tr>
              ) : dealers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#5F6F65]">
                    No sub-dealers onboarded yet. Click "Onboard New Dealer" to invite local installers.
                  </td>
                </tr>
              ) : (
                dealers.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F7FAF8] transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-[#17211B] text-sm">{d.business_name}</div>
                      <div className="text-[11px] text-[#5F6F65]">{d.email} • {d.mobile}</div>
                    </td>
                    <td className="p-3.5 font-mono text-[#1F8F4E] font-bold">
                      {d.dealer_code}
                    </td>
                    <td className="p-3.5 font-mono text-[#17211B]">
                      {d.gst_number}
                    </td>
                    <td className="p-3.5 font-bold text-[#17211B]">
                      {d.monthly_volume_kw} kW
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          d.activation_status === 'active'
                            ? 'bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]'
                            : 'bg-[#FEF9E7] text-[#9A7300] border border-[#F5B70040]'
                        }`}
                      >
                        {d.activation_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#5F6F65]">
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
        <div className="fixed inset-0 bg-[#17211B]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#DDE8E1] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-lg text-[#17211B]">Onboard New Solar Dealer</h3>
            <p className="text-xs text-[#5F6F65]">
              Invite a local installer or EPC contractor to procure wholesale equipment under your hub.
            </p>

            {inviteResult ? (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#ECF8F1] border border-[#DDE8E1] text-xs text-[#1F8F4E] space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <FiCheckCircle className="text-[#1F8F4E]" /> Invitation Dispatched!
                  </div>
                  <div>An official invitation link was emailed to the dealer.</div>
                  <div className="p-2 rounded bg-[#FFFFFF] font-mono text-[11px] text-[#1F8F4E] border border-[#DDE8E1] break-all select-all">
                    {inviteResult.invite_link}
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E]"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1">Dealer Enterprise Name *</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.business_name}
                    onChange={(e) => setInviteForm({ ...inviteForm, business_name: e.target.value })}
                    placeholder="e.g. Gujarat Solar Power EPC"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1">Dealer Email *</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="dealer@solarpower.in"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1">Dealer Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={inviteForm.mobile}
                    onChange={(e) => setInviteForm({ ...inviteForm, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F7FAF8] text-[#5F6F65] border border-[#DDE8E1] hover:bg-[#ECF8F1] hover:text-[#17211B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E]"
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
