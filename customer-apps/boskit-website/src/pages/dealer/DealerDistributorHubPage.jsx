import React, { useState, useEffect } from 'react';
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiShield,
  FiCheckCircle,
} from 'react-icons/fi';
import api from '../../services/api';

export default function DealerDistributorHubPage() {
  const [hub, setHub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dealer/distributor-hub')
      .then((res) => {
        if (res.data?.success) setHub(res.data.hub);
      })
      .catch((err) => console.error('Error fetching hub:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading regional hub depot...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      
      {/* ── Royal Blue Header Banner ────────────────────────────────────────── */}
      <div className="bg-[#185ADB] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md mb-2">
              <FiMapPin size={14} />
              <span>Assigned Regional Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-heading">
              Assigned Regional Distributor Depot
            </h1>
            <p className="mt-1 text-blue-100 text-xs sm:text-sm">
              Your authorized district warehouse depot for local equipment pickup, fast delivery dispatch, and RMA replacement.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Hub Main Profile Card */}
        <div className="md:col-span-2 p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                Authorized Master Depot
              </span>
              <h2 className="font-heading font-black text-2xl text-slate-900 mt-2">
                {hub?.business_name || 'Gujarat Solar Logistics Hub'}
              </h2>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                GSTIN: {hub?.gst_number || '24ABCDE1234F1Z5'}
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <FiCheckCircle /> Operational Hub
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <FiMapPin className="text-blue-700 mt-0.5 shrink-0" size={16} />
              <div>
                <strong className="text-slate-900 block font-bold">Depot Physical Address</strong>
                <span className="text-slate-600">
                  {hub?.pickup_address || 'Plot 104, Industrial Logistics Zone, Phase II'},{' '}
                  {hub?.city || 'Ahmedabad'}, {hub?.state || 'Gujarat'} - {hub?.pincode || '380001'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-3">
                <FiPhone className="text-blue-700 shrink-0" size={16} />
                <div>
                  <strong className="text-slate-900 block font-bold">Dispatch Hotline</strong>
                  <span className="text-slate-600">{hub?.hotline || '+91 98765 00001'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiMail className="text-blue-700 shrink-0" size={16} />
                <div>
                  <strong className="text-slate-900 block font-bold">Commercial Invoicing</strong>
                  <span className="text-slate-600">{hub?.email || 'distributor@solarkits.in'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours & Dispatch SLAs */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <FiClock className="text-blue-700" /> Depot Operating Hours
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="text-slate-900 font-semibold">
                {hub?.dispatch_hours || 'Mon - Sat: 9:00 AM - 7:00 PM'}
              </div>
              <div className="text-[11px] text-slate-500">
                Same-day pickup available for orders confirmed before 2:00 PM.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
            <strong className="block mb-1 font-bold">Local RMA & Warranty Svc:</strong>
            Immediate on-site module & inverter testing at this depot.
          </div>
        </div>

      </div>
    </div>
  );
}
