import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiCheckCircle,
  FiBriefcase,
  FiTruck,
  FiArrowRight,
  FiTrendingUp,
  FiMapPin,
  FiShield,
  FiDollarSign,
} from 'react-icons/fi';

export default function DealerProgramPage() {
  const dealerPerks = [
    {
      title: 'Zero Joining Fee',
      desc: 'Join the SolarKits dealer network at no platform charge through your authorized district distributor.',
      icon: FiDollarSign,
    },
    {
      title: 'Competitive Local Dealer Rates',
      desc: 'Access verified wholesale dealer pricing on single-unit or small-batch solar inverters, modules, and kits.',
      icon: FiTrendingUp,
    },
    {
      title: 'Local District Inventory Hub',
      desc: 'Pick up components directly from your district distributor warehouse or enjoy fast regional delivery.',
      icon: FiTruck,
    },
    {
      title: 'Factory Warranties Honored',
      desc: '100% genuine Tier-1 products with direct manufacturer warranty replacement coverage and technical backup.',
      icon: FiShield,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 bg-[#FFFFFF]">
      
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1] inline-block shadow-xs">
          Local Installer & Retail Partner Network
        </span>
        <h1 className="font-heading font-black text-4xl sm:text-5xl text-[#17211B] tracking-tight">
          SolarKits BOS Authorized Dealer Network
        </h1>
        <p className="text-base text-[#5F6F65] leading-relaxed max-w-2xl mx-auto">
          Are you a local solar system installer, EPC contractor, or electrical retailer? Connect directly with your district distributor for wholesale equipment access with zero MOQ barriers.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <Link
            to="/contact?inquiry=dealer"
            className="px-8 py-4 rounded-xl text-sm font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-sm flex items-center gap-2 transition-all"
          >
            Connect With District Distributor <FiArrowRight className="text-[#F5B700]" />
          </Link>
          <Link
            to="/auth/login"
            className="px-6 py-4 rounded-xl text-sm font-bold bg-[#FFFFFF] text-[#1F8F4E] border border-[#DDE8E1] hover:bg-[#ECF8F1] shadow-xs transition-all"
          >
            Dealer Portal Sign In
          </Link>
        </div>
      </div>

      {/* 4 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dealerPerks.map((perk, i) => (
          <div key={i} className="bg-[#FFFFFF] border border-[#DDE8E1] p-6 rounded-2xl space-y-3 shadow-xs hover:shadow-md hover:border-[#1F8F4E]/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center text-[#1F8F4E]">
              <perk.icon className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-lg text-[#17211B]">{perk.title}</h3>
            <p className="text-xs text-[#5F6F65] leading-relaxed">{perk.desc}</p>
          </div>
        ))}
      </div>

      {/* Dealer vs Distributor Comparison */}
      <div className="bg-[#FFFFFF] border border-[#DDE8E1] p-8 sm:p-10 rounded-3xl shadow-xs space-y-6">
        <h2 className="font-heading font-bold text-2xl text-[#17211B] text-center">
          Choosing Your Partnership Tier
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#ECF8F1] border border-[#DDE8E1] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-xl text-[#17211B]">Authorized Distributor</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FFFFFF] text-[#1F8F4E] border border-[#DDE8E1]">Territory Master</span>
            </div>
            <ul className="space-y-2 text-xs text-[#17211B]">
              <li className="flex items-center gap-2"><FiCheckCircle className="text-[#1F8F4E] w-4 h-4" /> Exclusive District / State Territorial Rights</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-[#1F8F4E] w-4 h-4" /> Highest Margin Slabs (8% - 25%)</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-[#1F8F4E] w-4 h-4" /> Sub-Dealer Network Onboarding Privileges</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-[#1F8F4E] w-4 h-4" /> Direct Container Factory Dispatches</li>
            </ul>
            <Link to="/distributor" className="block text-center py-2.5 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] transition-colors shadow-xs">
              Explore Distributor Model
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-xl text-[#17211B]">Authorized Dealer</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FFFFFF] text-[#17211B] border border-[#DDE8E1]">Local Installer</span>
            </div>
            <ul className="space-y-2 text-xs text-[#5F6F65]">
              <li className="flex items-center gap-2"><FiCheckCircle className="text-[#1F8F4E] w-4 h-4" /> Zero Upfront Distributor / Joining Fees</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-[#1F8F4E] w-4 h-4" /> Single-Unit MOQ Availability on Inverters & Kits</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-[#1F8F4E] w-4 h-4" /> Fast Pickup from Local District Distributor</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-[#1F8F4E] w-4 h-4" /> Dedicated Dealer Web & Mobile Dashboard</li>
            </ul>
            <Link to="/contact?inquiry=dealer" className="block text-center py-2.5 rounded-xl text-xs font-bold bg-[#17211B] text-white hover:bg-[#1F8F4E] transition-colors shadow-xs">
              Request Dealer Account
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
