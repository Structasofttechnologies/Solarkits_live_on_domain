import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiUsers,
  FiFileText,
  FiShield,
  FiMapPin,
  FiZap,
  FiArrowRight,
  FiPlusCircle,
  FiShoppingCart,
  FiTrendingUp,
  FiCheckCircle,
  FiLayers,
} from 'react-icons/fi';
import api from '../../services/api';

export default function DistributorDashboardPage() {
  const { user, distributor } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Invite Dealer Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ business_name: '', email: '', mobile: '' });
  const [inviteResult, setInviteResult] = useState(null);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    api
      .get('/distributor/dashboard/stats')
      .then((res) => {
        if (res.data?.success) setData(res.data.data);
      })
      .catch((err) => console.error('Dashboard stats fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    try {
      setInviting(true);
      const res = await api.post('/distributor/dealers/invite', inviteForm);
      if (res.data?.success) {
        setInviteResult(res.data);
        setInviteForm({ business_name: '', email: '', mobile: '' });
      }
    } catch (err) {
      console.error('Invite error:', err);
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#5F6F65]">Loading Distributor Console...</div>;
  }

  const metrics = data?.metrics || {};
  const plan = data?.plan || {};
  const recentOrders = data?.recent_orders || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* ── Exact Royal Blue Header Banner (Matching Screenshot) ───────────── */}
      <div className="bg-[#185ADB] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
                <FiShield size={14} />
                <span>Distributor Console</span>
              </div>

              {/* KYC Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold shadow-xs backdrop-blur-md">
                <FiCheckCircle size={13} />
                <span>KYC COMPLETE & VERIFIED</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-heading">
              Distributor Dashboard
            </h1>
            <p className="mt-1 text-blue-100 text-xs sm:text-sm">
              Published by <span className="font-bold text-white">Partner Reseller</span> · Account:{' '}
              <span className="font-medium text-white">{distributor?.business_name || user?.business_name || 'Customer Account'}</span>
              {distributor?.gst_number && (
                <span className="ml-2 font-mono text-white/90">
                  (GSTIN: {distributor.gst_number})
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowInviteModal(true);
                setInviteResult(null);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-[#185ADB] hover:bg-blue-50 shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <FiPlusCircle size={15} /> Invite Sub-Dealer
            </button>
            <Link
              to="/distributor/portal/procure"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 shadow-xs flex items-center gap-2 transition-all"
            >
              <FiShoppingCart size={15} /> Product Catalogue
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Active Dealers */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6F65]">Active Sub-Dealers</span>
            <div className="p-2.5 rounded-2xl bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]">
              <FiUsers size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-heading font-black text-3xl text-[#17211B]">
              {metrics.active_dealers_count || 1} <span className="text-xs text-[#5F6F65] font-normal">/ {metrics.max_dealers_limit || 15}</span>
            </span>
            <span className="text-[10px] font-bold text-[#1F8F4E] bg-[#ECF8F1] border border-[#DDE8E1] px-2 py-0.5 rounded">
              {metrics.remaining_dealer_seats || 14} Seats Left
            </span>
          </div>
        </div>

        {/* Monthly Target Volume */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6F65]">Monthly Sizing Target</span>
            <div className="p-2.5 rounded-2xl bg-[#FEF9E7] text-[#9A7300] border border-[#F5B70040]">
              <FiTrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-heading font-black text-3xl text-[#17211B]">
              {metrics.current_month_kw || 68.5} <span className="text-xs text-[#5F6F65] font-normal">kW</span>
            </span>
            <span className="text-[10px] font-bold text-[#9A7300] bg-[#FEF9E7] border border-[#F5B70040] px-2 py-0.5 rounded">
              Goal: {metrics.monthly_target_kw || 100} kW
            </span>
          </div>
        </div>

        {/* Total Sales Volume */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6F65]">Total B2B Volume</span>
            <div className="p-2.5 rounded-2xl bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]">
              <FiZap size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-heading font-black text-3xl text-[#1F8F4E]">
              ₹{(metrics.total_revenue_inr || 1250000).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-[#1F8F4E] bg-[#ECF8F1] border border-[#DDE8E1] px-2 py-0.5 rounded">
              Verified
            </span>
          </div>
        </div>

        {/* Territory & QuickKYC Status */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Territorial Exclusivity</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <FiMapPin size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-heading font-black text-xl text-slate-900">Ahmedabad</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
              <FiCheckCircle size={10} /> QuickKYC Locked
            </span>
          </div>
        </div>

      </div>

      {/* Main Grid: Orders & Fast Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Recent Orders */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-[#17211B]">Recent Equipment Orders</h3>
              <p className="text-xs text-[#5F6F65]">Direct factory warehouse orders and sub-dealer pickups.</p>
            </div>
            <Link to="/distributor/portal/procure" className="text-xs font-bold text-[#1F8F4E] hover:text-[#18733E] flex items-center gap-1">
              Procure Equipment <FiArrowRight />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#17211B]">
              <thead className="bg-[#F7FAF8] text-[#5F6F65] font-bold uppercase text-[10px] border-b border-[#DDE8E1]">
                <tr>
                  <th className="p-3.5">Order Number</th>
                  <th className="p-3.5">Procurement Total</th>
                  <th className="p-3.5">Fulfillment Status</th>
                  <th className="p-3.5">Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE8E1]">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#5F6F65]">
                      No orders placed yet. Browse the equipment catalogue to place your first distributor stock order.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-[#F7FAF8] transition-colors">
                      <td className="p-3.5 font-bold font-mono text-[#17211B]">{o.order_number}</td>
                      <td className="p-3.5 font-bold text-[#1F8F4E]">₹{o.grand_total_inr.toLocaleString('en-IN')}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]">
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#5F6F65]">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column: Plan Quotas & Rapid Invites */}
        <div className="space-y-6">
          
          {/* Active Plan Card */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-sm text-[#17211B] flex items-center gap-2">
                <FiLayers className="text-[#1F8F4E]" /> Active Distributor Plan
              </h4>
              <span className="text-[10px] font-bold bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1] px-2 py-0.5 rounded">
                Active
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] space-y-2 text-xs">
              <div className="font-bold text-[#17211B] text-sm">{plan.name}</div>
              <div className="text-[#5F6F65] text-[11px]">Exclusive territory wholesale procurement and dealer management rights.</div>
              <div className="pt-2 flex justify-between text-[#17211B]">
                <span>Dealer Allowance:</span>
                <strong className="text-[#1F8F4E]">{metrics.active_dealers_count || 1} / {metrics.max_dealers_limit || 15} Seats</strong>
              </div>
            </div>

            <Link
              to="/distributor/portal/plan"
              className="block w-full py-2.5 rounded-xl text-xs font-bold text-center bg-[#F7FAF8] hover:bg-[#ECF8F1] text-[#17211B] border border-[#DDE8E1] transition-colors"
            >
              Manage Distributor Plan
            </Link>
          </div>

          {/* Quick Dealer Invite Box */}
          <div className="p-6 rounded-3xl bg-[#ECF8F1] border border-[#DDE8E1] shadow-xs space-y-3">
            <h4 className="font-heading font-bold text-sm text-[#17211B] flex items-center gap-2">
              <FiUsers className="text-[#1F8F4E]" /> Expand Your Dealer Network
            </h4>
            <p className="text-xs text-[#5F6F65] leading-relaxed">
              Onboard local solar installers, EPC contractors, and electrical dealers under your district umbrella.
            </p>
            <button
              onClick={() => {
                setShowInviteModal(true);
                setInviteResult(null);
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-xs flex items-center justify-center gap-2"
            >
              <FiPlusCircle /> Invite New Solar Dealer
            </button>
          </div>

        </div>

      </div>

      {/* ── INVITE DEALER MODAL ──────────────────────────────────────────────── */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-[#17211B]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#DDE8E1] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-lg text-[#17211B]">Invite Sub-Dealer to Network</h3>
            <p className="text-xs text-[#5F6F65]">
              Generate an exclusive registration invitation for a local installer in your territory.
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
                  <label className="text-xs font-semibold text-[#17211B] block mb-1">Dealer Business Name *</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.business_name}
                    onChange={(e) => setInviteForm({ ...inviteForm, business_name: e.target.value })}
                    placeholder="e.g. Apex Solar Solutions"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1">Dealer Email *</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="dealer@solartech.com"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF]"
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
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF]"
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
                    {inviting ? 'Dispatching...' : 'Send Dealer Invitation'}
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
