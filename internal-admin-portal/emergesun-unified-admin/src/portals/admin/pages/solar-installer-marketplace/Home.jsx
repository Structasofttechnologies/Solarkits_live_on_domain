import React from "react";
import { useParams } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import { FaBuilding, FaUserCheck, FaGavel, FaStar, FaHandshake, FaGlobe } from "react-icons/fa";
import PageHeader from "@/components/PageHeader";

const MARKET_COUNTRY_CONFIGS = {
  india: {
    code: "IN",
    name: "India",
    currency: "₹",
    stats: [
      { label: "Verified Installers", value: "840", description: "Empaneled agencies" },
      { label: "Bids Submitted", value: "2,450", description: "This week" },
      { label: "Active Project Leads", value: "480 Leads", description: "Across 12 cities" },
      { label: "Avg Quotation", value: "₹4.8L", description: "Per 5kW Rooftop" }
    ],
    infoMessage: "Manage government empaneled solar vendors, verify state-wise rooftop subsidy registration eligibility, and monitor installer bids."
  },
  australia: {
    code: "AU",
    name: "Australia",
    currency: "A$",
    stats: [
      { label: "CEC Accredited", value: "320 Agencies", description: "Verified installers" },
      { label: "Bids Submitted", value: "890", description: "This week" },
      { label: "Active Project Leads", value: "115 Leads", description: "NSW, VIC, QLD" },
      { label: "Avg Quotation", value: "A$8.5K", description: "Per 6.6kW system" }
    ],
    infoMessage: "Track Clean Energy Council (CEC) accreditation details, monitor STC discount bidding rates, and verify grid protection compliance approvals."
  },
  global: {
    code: "",
    name: "Global",
    currency: "$",
    stats: [
      { label: "Total Installers", value: "450", description: "Global directory" },
      { label: "Total Bids", value: "1,200", description: "Active bids" },
      { label: "Success Rate", value: "94.2%", description: "Match success" },
      { label: "Leads Matched", value: "3,800+", description: "Total connections" }
    ],
    infoMessage: "Manage installer profiles, verification workflows, reviews, consumer ratings, and bidding rules."
  }
};

export default function Home() {
  const { countryName } = useParams();
  const activeKey = countryName?.toLowerCase();
  const config = MARKET_COUNTRY_CONFIGS[activeKey] || MARKET_COUNTRY_CONFIGS.global;

  return (
    <div className="min-h-screen space-y-6">
      <PageHeader
        title={`Solar Installer Marketplace - ${config.name}`}
        subtitle={`Match verified installers with prospective solar project buyers in ${config.name}`}
        icon={FaBuilding}
        stats={config.stats}
        actions={
          config.code ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-2xl shadow-sm">
              <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-surface-hover border border-border shadow-inner shrink-0">
                <ReactCountryFlag
                  countryCode={config.code}
                  svg
                  style={{ width: "1.2em", height: "1.2em" }}
                  title={config.name}
                />
              </div>
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">{config.name} Market</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-2xl shadow-sm">
              <FaGlobe className="text-primary w-4 h-4" />
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">All Markets</span>
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg">
            <FaUserCheck size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Installer Verification</h3>
            <p className="text-text-secondary text-sm">Verify compliance documents, license status, and credentials.</p>
          </div>
          <div className="mt-auto pt-4 border-t border-border">
            <span className="text-primary font-bold cursor-pointer hover:underline text-sm">Verify Installers &rarr;</span>
          </div>
        </div>

        <div className="card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
            <FaGavel size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Bids & Quotations</h3>
            <p className="text-text-secondary text-sm">Monitor active bidding matches, client negotiations, and bids.</p>
          </div>
          <div className="mt-auto pt-4 border-t border-border">
            <span className="text-primary font-bold cursor-pointer hover:underline text-sm">Review Bids &rarr;</span>
          </div>
        </div>

        <div className="card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-success text-white flex items-center justify-center shadow-lg">
            <FaStar size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Installer Reviews</h3>
            <p className="text-text-secondary text-sm">Track customer feedback, quality scores, and rating audits.</p>
          </div>
          <div className="mt-auto pt-4 border-t border-border">
            <span className="text-primary font-bold cursor-pointer hover:underline text-sm">View Feedback &rarr;</span>
          </div>
        </div>

        {activeKey && (
          <div className="card p-6 md:col-span-3 flex flex-col gap-3 bg-gradient-to-r from-primary/[0.02] to-transparent border-l-4 border-l-primary">
            <h4 className="font-bold text-text-primary text-base">Marketplace Safeguards ({config.name})</h4>
            <p className="text-text-secondary text-sm leading-relaxed">{config.infoMessage}</p>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <FaHandshake className="text-primary" />
                <span>Escrow Payments System</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <FaUserCheck className="text-success" />
                <span>Verified Clean Energy Licenses</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
