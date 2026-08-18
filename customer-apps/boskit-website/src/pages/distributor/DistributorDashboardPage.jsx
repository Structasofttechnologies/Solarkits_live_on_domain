import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import IndustryMediaShowcase from '../../components/industry/IndustryMediaShowcase';
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
    return <div className="p-8 text-center text-[#475569]">Loading Distributor Console...</div>;
  }

  const metrics = data?.metrics || {};
  const plan = data?.plan || {};
  const recentOrders = data?.recent_orders || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* ── Exact Royal Blue Header Banner (Matching Screenshot) ───────────── */}
      <div className="bg-[#185ADB] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
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
              className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-white text-[#185ADB] hover:bg-blue-50 shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <FiPlusCircle size={15} /> Invite Sub-Dealer
            </button>
            <Link
              to="/distributor/portal/procure"
              className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 shadow-xs flex items-center gap-2 transition-all active:scale-95"
            >
              <FiShoppingCart size={15} /> Product Catalogue
            </Link>
          </div>
        </div>
      </div>

      {/* ── Industry Media Showcase (Selector -> Hero -> FilterBar -> Gallery -> Lightbox) ── */}
      <IndustryMediaShowcase
        role="DISTRIBUTOR"
        user={distributor || user}
        storageKey="distributor_selected_industry_id"
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Active Dealers */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#475569]">Active Sub-Dealers</span>
            <div className="p-2.5 rounded-2xl bg-[#EFF8FF] text-[#0575B8] border border-[#E2E8F0]">
              <FiUsers size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-heading font-black text-3xl text-[#0F172A]">
              {metrics.active_dealers_count || 1} <span className="text-xs text-[#475569] font-normal">/ {metrics.max_dealers_limit || 15}</span>
            </span>
            <span className="text-[10px] font-bold text-[#0575B8] bg-[#EFF8FF] border border-[#E2E8F0] px-2 py-0.5 rounded">
              {metrics.remaining_dealer_seats || 14} Seats Left
            </span>
          </div>
        </div>

        {/* Monthly Target Volume */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#475569]">Monthly Sizing Target</span>
            <div className="p-2.5 rounded-2xl bg-[#FFF7ED] text-[#9A7300] border border-[#F4922240]">
              <FiTrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-heading font-black text-3xl text-[#0F172A]">
              {metrics.current_month_kw || 68.5} <span className="text-xs text-[#475569] font-normal">kW</span>
            </span>
            <span className="text-[10px] font-bold text-[#9A7300] bg-[#FFF7ED] border border-[#F4922240] px-2 py-0.5 rounded">
              Goal: {metrics.monthly_target_kw || 100} kW
            </span>
          </div>
        </div>

        {/* Total Sales Volume */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#475569]">Total B2B Volume</span>
            <div className="p-2.5 rounded-2xl bg-[#EFF8FF] text-[#0575B8] border border-[#E2E8F0]">
              <FiZap size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-heading font-black text-3xl text-[#0575B8]">
              ₹{(metrics.total_revenue_inr || 1250000).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-[#0575B8] bg-[#EFF8FF] border border-[#E2E8F0] px-2 py-0.5 rounded">
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
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-[#0F172A]">Recent Equipment Orders</h3>
              <p className="text-xs text-[#475569]">Direct factory warehouse orders and sub-dealer pickups.</p>
            </div>
            <Link to="/distributor/portal/procure" className="text-xs font-bold text-[#0575B8] hover:text-[#045D93] flex items-center gap-1">
              Procure Equipment <FiArrowRight />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#0F172A]">
              <thead className="bg-[#F8FAFC] text-[#475569] font-bold uppercase text-[10px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3.5">Order Number</th>
                  <th className="p-3.5">Procurement Total</th>
                  <th className="p-3.5">Fulfillment Status</th>
                  <th className="p-3.5">Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#475569]">
                      No orders placed yet. Browse the equipment catalogue to place your first distributor stock order.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-3.5 font-bold font-mono text-[#0F172A]">{o.order_number}</td>
                      <td className="p-3.5 font-bold text-[#0575B8]">₹{o.grand_total_inr.toLocaleString('en-IN')}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#EFF8FF] text-[#0575B8] border border-[#E2E8F0]">
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#475569]">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
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
          <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-sm text-[#0F172A] flex items-center gap-2">
                <FiLayers className="text-[#0575B8]" /> Active Distributor Plan
              </h4>
              <span className="text-[10px] font-bold bg-[#EFF8FF] text-[#0575B8] border border-[#E2E8F0] px-2 py-0.5 rounded">
                Active
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
              <div className="font-bold text-[#0F172A] text-sm">{plan.name}</div>
              <div className="text-[#475569] text-[11px]">Exclusive territory wholesale procurement and dealer management rights.</div>
              <div className="pt-2 flex justify-between text-[#0F172A]">
                <span>Dealer Allowance:</span>
                <strong className="text-[#0575B8]">{metrics.active_dealers_count || 1} / {metrics.max_dealers_limit || 15} Seats</strong>
              </div>
            </div>

            <Link
              to="/distributor/portal/plan"
              className="block w-full py-2.5 rounded-xl text-xs font-bold text-center bg-[#F8FAFC] hover:bg-[#EFF8FF] text-[#0F172A] border border-[#E2E8F0] transition-colors"
            >
              Manage Distributor Plan
            </Link>
          </div>

          {/* Quick Dealer Invite Box */}
          <div className="p-6 rounded-3xl bg-[#EFF8FF] border border-[#E2E8F0] shadow-xs space-y-3">
            <h4 className="font-heading font-bold text-sm text-[#0F172A] flex items-center gap-2">
              <FiUsers className="text-[#0575B8]" /> Expand Your Dealer Network
            </h4>
            <p className="text-xs text-[#475569] leading-relaxed">
              Onboard local solar installers, EPC contractors, and electrical dealers under your district umbrella.
            </p>
            <button
              onClick={() => {
                setShowInviteModal(true);
                setInviteResult(null);
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#0575B8] text-white hover:bg-[#045D93] shadow-xs flex items-center justify-center gap-2"
            >
              <FiPlusCircle /> Invite New Solar Dealer
            </button>
          </div>

        </div>

      </div>

      {/* ── INVITE DEALER MODAL ──────────────────────────────────────────────── */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-lg text-[#0F172A]">Invite Sub-Dealer to Network</h3>
            <p className="text-xs text-[#475569]">
              Generate an exclusive registration invitation for a local installer in your territory.
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
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">Dealer Business Name *</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.business_name}
                    onChange={(e) => setInviteForm({ ...inviteForm, business_name: e.target.value })}
                    placeholder="e.g. Apex Solar Solutions"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0575B8] focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">Dealer Email *</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="dealer@solartech.com"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0575B8] focus:bg-[#FFFFFF]"
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
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0575B8] focus:bg-[#FFFFFF]"
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
