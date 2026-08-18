import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiTruck,
  FiCheckCircle,
  FiArrowRight,
  FiDollarSign,
  FiAward,
  FiLayers,
} from 'react-icons/fi';

export default function DistributorProgramPage() {
  const benefits = [
    {
      title: 'Guaranteed Territory Lock',
      desc: 'Exclusive rights for your assigned revenue district or state. No other distributor can be appointed in your jurisdiction.',
      icon: FiShield,
    },
    {
      title: 'Direct Wholesale Margin Slabs',
      desc: 'Tiered margin structures (8% to 25% on Tier-1 inverters, panels, and BOS kits) with complete volume bonus rebates.',
      icon: FiTrendingUp,
    },
    {
      title: 'Dealer Network Management Rights',
      desc: 'Onboard and manage local solar installers and dealers in your district. Set customized pricing within admin-approved boundaries.',
      icon: FiUsers,
    },
    {
      title: 'Priority Hub Allocation',
      desc: 'Direct reserved stock allocations at regional logistics hubs with 24-48h dispatch guarantees.',
      icon: FiTruck,
    },
    {
      title: 'Marketing & Lead Pass-Through',
      desc: 'SOLARKITS national marketing inquiries in your district are automatically routed to your distributor portal.',
      icon: FiAward,
    },
    {
      title: 'Dedicated Account Support',
      desc: 'Regional technical sales engineer assigned to assist with large commercial & industrial (C&I) project sizing and quotation.',
      icon: FiLayers,
    },
  ];

  const steps = [
    { num: '01', title: 'Basic Registration', desc: 'Create account with company name, email, and authorized mobile.' },
    { num: '02', title: 'GST Auto-Verification', desc: 'Enter GSTIN. Legal entity and address details auto-populate via GST gateway.' },
    { num: '03', title: 'Territory & Plan Selection', desc: 'Choose your desired district(s) or state and select your distributor tier.' },
    { num: '04', title: 'KYC Document Upload', desc: 'Securely upload PAN, GST certificate, bank proof, and shop photos.' },
    { num: '05', title: 'Review & Activation', desc: 'Admin reviews within 24h. Get instant portal access and dealer onboard rights.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 bg-[#FFFFFF]">
      
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EFF8FF] text-[#0575B8] border border-[#E2E8F0] inline-block shadow-xs">
          B2B Regional Distributor Partnership
        </span>
        <h1 className="font-heading font-black text-4xl sm:text-5xl text-[#0F172A] tracking-tight">
          SolarKits BOS Authorized Distributor Program
        </h1>
        <p className="text-base text-[#475569] leading-relaxed max-w-2xl mx-auto">
          Scale your commercial solar supply business with guaranteed district-level territorial exclusivity, wholesale pricing slabs, and sub-dealer network management rights.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <Link
            to="/distributor/onboarding"
            className="px-8 py-4 rounded-xl text-sm font-bold bg-[#0575B8] text-white hover:bg-[#045D93] shadow-sm flex items-center gap-2 transition-all"
          >
            Apply for Exclusive Territory <FiArrowRight className="text-[#F49222]" />
          </Link>
          <Link
            to="/plans"
            className="px-6 py-4 rounded-xl text-sm font-bold bg-[#FFFFFF] text-[#0575B8] border border-[#E2E8F0] hover:bg-[#EFF8FF] shadow-xs transition-all"
          >
            View Distributor Tiers
          </Link>
        </div>
      </div>

      {/* 6 Key Benefits */}
      <div className="space-y-6">
        <h2 className="font-heading font-bold text-2xl text-[#0F172A] text-center">
          Distributor Partner Privileges
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, idx) => (
            <div key={idx} className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 rounded-2xl space-y-3 shadow-xs hover:shadow-md hover:border-[#0575B8]/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] border border-[#E2E8F0] flex items-center justify-center text-[#0575B8]">
                <b.icon className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#0F172A]">{b.title}</h3>
              <p className="text-xs text-[#475569] leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Onboarding Roadmap */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-8 sm:p-12 rounded-3xl space-y-8 shadow-xs">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
            5-Stage Rapid Distributor Onboarding
          </h2>
          <p className="text-xs text-[#475569]">
            Our fully digital onboarding engine lets you verify your GST, choose your territory, and submit KYC in under 10 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((s, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 hover:border-[#0575B8]/40 transition-colors">
              <span className="font-heading font-black text-2xl text-[#0575B8]">{s.num}</span>
              <h4 className="font-heading font-bold text-sm text-[#0F172A]">{s.title}</h4>
              <p className="text-[11px] text-[#475569] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center bg-[#EFF8FF] border border-[#E2E8F0] p-10 rounded-3xl space-y-4 shadow-xs">
        <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
          Secure Your Territory Before It Is Awarded
        </h2>
        <p className="text-xs text-[#475569] max-w-lg mx-auto">
          Distributor territories are awarded on a strict first-come, first-evaluated basis. Check district availability and start your application today.
        </p>
        <Link
          to="/auth/register"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold bg-[#0575B8] text-white hover:bg-[#045D93] shadow-sm transition-all"
        >
          Begin Distributor Application <FiArrowRight className="text-[#F49222]" />
        </Link>
      </div>

    </div>
  );
}
