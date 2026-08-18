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
    return <div className="p-8 text-center text-[#5F6F65]">Loading territory data...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#17211B]">
          Territorial Exclusivity & Jurisdiction
        </h1>
        <p className="text-xs sm:text-sm text-[#5F6F65] mt-0.5">
          Guaranteed regional protection ensuring no competing authorized distributors are assigned in your revenue district.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Status Card */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6F65]">Territory Status</span>
            <span className="text-[10px] font-bold bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1] px-2 py-0.5 rounded flex items-center gap-1">
              <FiCheckCircle /> Protected
            </span>
          </div>

          <div>
            <div className="text-xs text-[#5F6F65]">Revenue District</div>
            <div className="font-heading font-black text-2xl text-[#1F8F4E] mt-0.5">
              {territory?.district || 'Ahmedabad'}
            </div>
            <div className="text-xs text-[#5F6F65] mt-1">{territory?.state || 'Gujarat'} State Jurisdiction</div>
          </div>

          <div className="pt-2 border-t border-[#DDE8E1] text-xs text-[#5F6F65]">
            Protection Valid Until: <strong className="text-[#17211B]">August 2027</strong>
          </div>
        </div>

        {/* Protection Terms */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-[#17211B] flex items-center gap-2">
            <FiShield className="text-[#1F8F4E]" /> Statutory Territorial Non-Compete Guarantee
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] space-y-1">
              <span className="font-bold text-[#17211B] block">Exclusive Dealership Sourcing</span>
              <span className="text-[#5F6F65] text-[11px]">
                All registered installers within {territory?.district || 'Ahmedabad'} are mapped strictly to your distribution hub.
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] space-y-1">
              <span className="font-bold text-[#17211B] block">Direct Factory Wholesale Gate</span>
              <span className="text-[#5F6F65] text-[11px]">
                Protected wholesale margin tier ensuring zero price undercutting from external channels.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Permitted Product Whitelist */}
      <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-4">
        <h3 className="font-heading font-bold text-sm text-[#17211B] flex items-center gap-2">
          <FiLayers className="text-[#1F8F4E]" /> Authorized Commercial Categories Whitelist
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(territory?.permitted_categories || ['Tier-1 Inverters', 'TOPCon PV Modules', 'Mounting Systems', 'BOS Kits']).map((cat, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs font-semibold text-[#17211B] flex items-center gap-2">
              <FiCheckCircle className="text-[#1F8F4E] shrink-0" />
              <span>{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
