import React from 'react';
import { FiShield, FiZap, FiTruck, FiAward, FiCheckCircle } from 'react-icons/fi';

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 bg-[#FFFFFF]">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EFF8FF] text-[#0575B8] border border-[#E2E8F0] inline-block shadow-xs">
          Company Overview
        </span>
        <h1 className="font-heading font-black text-4xl sm:text-5xl text-[#0F172A] tracking-tight">
          About SolarKits BOS B2B Distribution
        </h1>
        <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
          SolarKits BOS is the specialized commercial solar equipment distribution arm of the SOLARKITS Ecosystem, bridging international Tier-1 solar manufacturers with regional distributors and certified local installers.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 rounded-2xl space-y-3 shadow-xs hover:shadow-md hover:border-[#0575B8]/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#EFF8FF] border border-[#E2E8F0] flex items-center justify-center text-[#0575B8]">
            <FiShield className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-[#0F172A]">Direct Manufacturer Pipeline</h3>
          <p className="text-xs text-[#475569] leading-relaxed">
            Direct bulk container indenting eliminates multi-layer broker margins, delivering genuine factory pricing directly to regional warehouse hubs.
          </p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 rounded-2xl space-y-3 shadow-xs hover:shadow-md hover:border-[#0575B8]/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#EFF8FF] border border-[#E2E8F0] flex items-center justify-center text-[#0575B8]">
            <FiTruck className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-[#0F172A]">Central Logistics Hubs</h3>
          <p className="text-xs text-[#475569] leading-relaxed">
            High-velocity transit depots in major industrial hubs ensure rapid 24 to 48-hour order dispatch across western and central India.
          </p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 rounded-2xl space-y-3 shadow-xs hover:shadow-md hover:border-[#0575B8]/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#EFF8FF] border border-[#E2E8F0] flex items-center justify-center text-[#0575B8]">
            <FiAward className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-[#0F172A]">100% Verified Quality</h3>
          <p className="text-xs text-[#475569] leading-relaxed">
            Every module and inverter is supplied with serial-tracked test flash reports, BIS certification, and comprehensive manufacturer warranty backup.
          </p>
        </div>
      </div>

      {/* Compliance Box */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-8 rounded-3xl shadow-xs space-y-4">
        <h2 className="font-heading font-bold text-xl text-[#0F172A]">Statutory & GST Compliance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-[#475569]">
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#475569] block">Platform Legal Entity</span>
            <span className="font-bold text-[#0F172A]">SolarKits Technologies Pvt Ltd</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#475569] block">Registration Type</span>
            <span className="font-bold text-[#0F172A]">B2B Commercial Wholesaler</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#475569] block">GST Invoicing</span>
            <span className="font-bold text-[#0575B8]">100% Tax Credit Verified</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#475569] block">Logistics Partner</span>
            <span className="font-bold text-[#0F172A]">National Surface Transit</span>
          </div>
        </div>
      </div>

    </div>
  );
}
