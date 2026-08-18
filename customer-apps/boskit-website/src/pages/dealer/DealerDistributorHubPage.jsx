import React, { useState, useEffect } from 'react';
import { FiMapPin, FiPhone, FiMail, FiClock, FiShield, FiCheckCircle } from 'react-icons/fi';
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
    return <div className="p-8 text-center text-[#5F6F65]">Loading regional hub depot...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#17211B]">
          Assigned Regional Distributor Depot
        </h1>
        <p className="text-xs sm:text-sm text-[#5F6F65] mt-0.5">
          Your authorized district warehouse depot for local equipment pickup, fast delivery dispatch, and RMA replacement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Hub Main Profile Card */}
        <div className="md:col-span-2 p-8 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#DDE8E1] pb-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F8F4E] bg-[#ECF8F1] px-2.5 py-1 rounded border border-[#DDE8E1]">
                Authorized Master Depot
              </span>
              <h2 className="font-heading font-black text-2xl text-[#17211B] mt-2">{hub?.business_name}</h2>
              <div className="text-xs text-[#5F6F65] font-mono mt-0.5">GSTIN: {hub?.gst_number}</div>
            </div>
            <span className="text-xs font-bold text-[#1F8F4E] bg-[#ECF8F1] px-3 py-1 rounded-full border border-[#DDE8E1] flex items-center gap-1.5">
              <FiCheckCircle /> Operational Hub
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <FiMapPin className="text-[#1F8F4E] mt-0.5 shrink-0" size={16} />
              <div>
                <strong className="text-[#17211B] block">Depot Physical Address</strong>
                <span className="text-[#5F6F65]">{hub?.pickup_address}, {hub?.city}, {hub?.state} - {hub?.pincode}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-3">
                <FiPhone className="text-[#1F8F4E] shrink-0" size={16} />
                <div>
                  <strong className="text-[#17211B] block">Dispatch Hotline</strong>
                  <span className="text-[#5F6F65]">{hub?.hotline}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiMail className="text-[#1F8F4E] shrink-0" size={16} />
                <div>
                  <strong className="text-[#17211B] block">Commercial Invoicing</strong>
                  <span className="text-[#5F6F65]">{hub?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours & Dispatch SLAs */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-sm text-[#17211B] flex items-center gap-2">
              <FiClock className="text-[#1F8F4E]" /> Depot Operating Hours
            </h4>
            <div className="p-3.5 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#5F6F65] space-y-1">
              <div className="text-[#17211B] font-semibold">{hub?.dispatch_hours || 'Mon - Sat: 9:00 AM - 7:00 PM'}</div>
              <div className="text-[11px] text-[#5F6F65]">Same-day pickup available for orders confirmed before 2:00 PM.</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#ECF8F1] border border-[#DDE8E1] text-xs text-[#1F8F4E]">
            <strong className="block mb-1">Local RMA & Warranty Svc:</strong>
            Immediate on-site module & inverter testing at this depot.
          </div>
        </div>

      </div>
    </div>
  );
}
