import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Search, 
  RotateCw, 
  MapPin, 
  Phone, 
  Mail, 
  FileCheck, 
  Zap, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Building2
} from 'lucide-react';
import api from '../services/api';

export default function BdeFranchisees() {
  const [franchisees, setFranchisees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchFranchisees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/franchisees');
      if (res.data?.status === 'success') {
        setFranchisees(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load franchisees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFranchisees();
  }, []);

  const filtered = search.trim()
    ? franchisees.filter(
        (f) =>
          f.business_name?.toLowerCase().includes(search.toLowerCase()) ||
          f.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
          f.reseller_code?.toLowerCase().includes(search.toLowerCase()) ||
          f.mobile?.includes(search)
      )
    : franchisees;

  const totalPartners = franchisees.length;
  const operationalCount = franchisees.filter((f) => f.is_operational).length;
  const onboardingCount = franchisees.filter((f) => !f.is_operational).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Attributed Franchisee Network
          </h1>
          <p className="text-xs text-slate-500">
            Real-time accounts, onboarding milestones, and operations tracking for your converted franchisee partners.
          </p>
        </div>

        <button
          onClick={fetchFranchisees}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total Attributed Partners</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalPartners}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Lifetime partner signups</span>
        </div>

        <div className="p-4.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Live Operational Stores</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{operationalCount}</div>
          <span className="text-[11px] text-emerald-500 mt-0.5 block">Active retail store setups</span>
        </div>

        <div className="p-4.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">In Onboarding Pipeline</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{onboardingCount}</div>
          <span className="text-[11px] text-amber-500 mt-0.5 block">Agreement / Fee / Setup phase</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Filter partners by business name, code, contact person, or mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-800 focus:outline-none placeholder-slate-400"
        />
      </div>

      {/* Main List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Franchisee Partners</h3>
            <p className="text-xs text-slate-500">Live accounts and onboarding status</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">
            {filtered.length} Partners
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RotateCw className="w-6 h-6 text-amber-500 animate-spin mx-auto mb-2" />
            Loading franchisee network...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Store className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            No attributed franchisee partners found. As you onboard prospective leads, they will appear here.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((f) => (
              <div key={f._id} className="p-6 hover:bg-slate-50/60 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 font-mono text-xs font-bold rounded-lg">
                        {f.reseller_code}
                      </span>
                      <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                        f.is_operational
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                          : f.activation_status === 'active'
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {f.is_operational ? 'OPERATIONS LIVE' : f.activation_status.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-900">{f.business_name}</h4>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {f.address?.district_name || 'Regional'}, {f.address?.state_name || 'State'}
                      </span>
                      &bull;
                      <span>Contact: <strong>{f.contact_person}</strong></span>
                      &bull;
                      <span>Mobile: {f.mobile}</span>
                      {f.gst_number && (
                        <>
                          &bull;
                          <span className="font-mono text-slate-600">GST: {f.gst_number}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Milestones Card */}
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">AGREEMENT</span>
                      <span className={`font-bold ${f.agreement_status === 'signed' ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {f.agreement_status === 'signed' ? 'Signed' : 'Pending'}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">FEE PAYMENT</span>
                      <span className={`font-bold ${f.fee_payment_status === 'verified' ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {f.fee_payment_status === 'verified' ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">RETAIL STORE</span>
                      <span className={`font-bold ${f.is_operational ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {f.is_operational ? 'Active' : 'In Setup'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
