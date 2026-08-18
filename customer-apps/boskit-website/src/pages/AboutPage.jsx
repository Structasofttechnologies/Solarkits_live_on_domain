import React from 'react';
import { FiShield, FiZap, FiTruck, FiAward, FiCheckCircle } from 'react-icons/fi';

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 bg-[#FFFFFF]">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1] inline-block shadow-xs">
          Company Overview
        </span>
        <h1 className="font-heading font-black text-4xl sm:text-5xl text-[#17211B] tracking-tight">
          About SolarKits BOS B2B Distribution
        </h1>
        <p className="text-sm sm:text-base text-[#5F6F65] leading-relaxed">
          SolarKits BOS is the specialized commercial solar equipment distribution arm of the SOLARKITS Ecosystem, bridging international Tier-1 solar manufacturers with regional distributors and certified local installers.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FFFFFF] border border-[#DDE8E1] p-6 rounded-2xl space-y-3 shadow-xs hover:shadow-md hover:border-[#1F8F4E]/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center text-[#1F8F4E]">
            <FiShield className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-[#17211B]">Direct Manufacturer Pipeline</h3>
          <p className="text-xs text-[#5F6F65] leading-relaxed">
            Direct bulk container indenting eliminates multi-layer broker margins, delivering genuine factory pricing directly to regional warehouse hubs.
          </p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#DDE8E1] p-6 rounded-2xl space-y-3 shadow-xs hover:shadow-md hover:border-[#1F8F4E]/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center text-[#1F8F4E]">
            <FiTruck className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-[#17211B]">Central Logistics Hubs</h3>
          <p className="text-xs text-[#5F6F65] leading-relaxed">
            High-velocity transit depots in major industrial hubs ensure rapid 24 to 48-hour order dispatch across western and central India.
          </p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#DDE8E1] p-6 rounded-2xl space-y-3 shadow-xs hover:shadow-md hover:border-[#1F8F4E]/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center text-[#1F8F4E]">
            <FiAward className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-[#17211B]">100% Verified Quality</h3>
          <p className="text-xs text-[#5F6F65] leading-relaxed">
            Every module and inverter is supplied with serial-tracked test flash reports, BIS certification, and comprehensive manufacturer warranty backup.
          </p>
        </div>
      </div>

      {/* Compliance Box */}
      <div className="bg-[#FFFFFF] border border-[#DDE8E1] p-8 rounded-3xl shadow-xs space-y-4">
        <h2 className="font-heading font-bold text-xl text-[#17211B]">Statutory & GST Compliance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-[#5F6F65]">
          <div className="p-3.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1]">
            <span className="text-[#5F6F65] block">Platform Legal Entity</span>
            <span className="font-bold text-[#17211B]">SolarKits Technologies Pvt Ltd</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1]">
            <span className="text-[#5F6F65] block">Registration Type</span>
            <span className="font-bold text-[#17211B]">B2B Commercial Wholesaler</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1]">
            <span className="text-[#5F6F65] block">GST Invoicing</span>
            <span className="font-bold text-[#1F8F4E]">100% Tax Credit Verified</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1]">
            <span className="text-[#5F6F65] block">Logistics Partner</span>
            <span className="font-bold text-[#17211B]">National Surface Transit</span>
          </div>
        </div>
      </div>

    </div>
  );
}
