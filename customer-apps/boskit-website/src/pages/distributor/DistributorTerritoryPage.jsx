import React, { useState, useEffect } from 'react';
import { FiMapPin, FiShield, FiCheckCircle, FiLock, FiLayers } from 'react-icons/fi';
import api from '../../services/api';

export default function DistributorTerritoryPage() {
  const [territory, setTerritory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/distributor/territory')
      .then((res) => {
        if (res.data?.success) setTerritory(res.data.territory);
      })
      .catch((err) => console.error('Territory fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-[#475569]">Loading territory data...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#0F172A]">
          Territorial Exclusivity & Jurisdiction
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
          Guaranteed regional protection ensuring no competing authorized distributors are assigned in your revenue district.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Status Card */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#475569]">Territory Status</span>
            <span className="text-[10px] font-bold bg-[#EFF8FF] text-[#0575B8] border border-[#E2E8F0] px-2 py-0.5 rounded flex items-center gap-1">
              <FiCheckCircle /> Protected
            </span>
          </div>

          <div>
            <div className="text-xs text-[#475569]">Revenue District</div>
            <div className="font-heading font-black text-2xl text-[#0575B8] mt-0.5">
              {territory?.district || 'Ahmedabad'}
            </div>
            <div className="text-xs text-[#475569] mt-1">{territory?.state || 'Gujarat'} State Jurisdiction</div>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0] text-xs text-[#475569]">
            Protection Valid Until: <strong className="text-[#0F172A]">August 2027</strong>
          </div>
        </div>

        {/* Protection Terms */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-[#0F172A] flex items-center gap-2">
            <FiShield className="text-[#0575B8]" /> Statutory Territorial Non-Compete Guarantee
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="font-bold text-[#0F172A] block">Exclusive Dealership Sourcing</span>
              <span className="text-[#475569] text-[11px]">
                All registered installers within {territory?.district || 'Ahmedabad'} are mapped strictly to your distribution hub.
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="font-bold text-[#0F172A] block">Direct Factory Wholesale Gate</span>
              <span className="text-[#475569] text-[11px]">
                Protected wholesale margin tier ensuring zero price undercutting from external channels.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Permitted Product Whitelist */}
      <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="font-heading font-bold text-sm text-[#0F172A] flex items-center gap-2">
          <FiLayers className="text-[#0575B8]" /> Authorized Commercial Categories Whitelist
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(territory?.permitted_categories || ['Tier-1 Inverters', 'TOPCon PV Modules', 'Mounting Systems', 'BOS Kits']).map((cat, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] flex items-center gap-2">
              <FiCheckCircle className="text-[#0575B8] shrink-0" />
              <span>{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
