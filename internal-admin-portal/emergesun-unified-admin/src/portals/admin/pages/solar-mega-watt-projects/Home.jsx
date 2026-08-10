import React from "react";
import { useParams } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import { FaIndustry, FaBolt, FaLeaf, FaSolarPanel, FaShieldAlt, FaGlobe } from "react-icons/fa";
import PageHeader from "@/components/PageHeader";

const MEGA_COUNTRY_CONFIGS = {
  india: {
    code: "IN",
    name: "India",
    currency: "₹",
    stats: [
      { label: "Commissioned MW", value: "2.4 GW", description: "Across 14 plants" },
      { label: "Grid Transmission", value: "100% Sync", description: "State grid load" },
      { label: "PPA Agreements", value: "8 Active", description: "SECI / State Discoms" },
      { label: "Carbon Offset", value: "320K Tons", description: "Annual carbon reduction" }
    ],
    infoMessage: "Manage utility-scale grid connections, SECI PPA tariff billing, state solar park regulatory filings, and power transmission monitoring."
  },
  australia: {
    code: "AU",
    name: "Australia",
    currency: "A$",
    stats: [
      { label: "Commissioned MW", value: "840 MW", description: "Across 6 solar farms" },
      { label: "AEMO Grid Sync", value: "98.9%", description: "FCAS market sync" },
      { label: "PPA Contracts", value: "4 Active", description: "Corporate and retailer" },
      { label: "LGCs Generated", value: "145K LGCs", description: "Clean Energy Regulator" }
    ],
    infoMessage: "Track AEMO dispatch compliance, monitor FCAS (Frequency Control Ancillary Services) bids, and manage Large-scale Generation Certificate (LGC) issuance."
  },
  global: {
    code: "",
    name: "Global",
    currency: "$",
    stats: [
      { label: "Active Plants", value: "32 Plants", description: "Utility scale" },
      { label: "Total MW", value: "4.8 GW", description: "Cumulative capacity" },
      { label: "PPA Contracts", value: "18 Total", description: "Power Purchase Agreements" },
      { label: "Carbon Offset", value: "1.2M Tons", description: "Global annual offset" }
    ],
    infoMessage: "Manage global utility-scale solar asset portfolios, institutional PPAs, transmission compliance, and plant telemetry configurations."
  }
};

export default function Home() {
  const { countryName } = useParams();
  const activeKey = countryName?.toLowerCase();
  const config = MEGA_COUNTRY_CONFIGS[activeKey] || MEGA_COUNTRY_CONFIGS.global;

  return (
    <div className="min-h-screen space-y-6">
      <PageHeader
        title={`Solar Mega Watt Projects - ${config.name}`}
        subtitle={`End-to-end management of utility-scale solar farms and grid-tied operations in ${config.name}`}
        icon={FaIndustry}
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
          <div className="w-12 h-12 rounded-2xl bg-danger text-white flex items-center justify-center shadow-lg">
            <FaBolt size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Grid Integration</h3>
            <p className="text-text-secondary text-sm">Monitor substation telemetry, transmission losses, and reactive power status.</p>
          </div>
          <div className="mt-auto pt-4 border-t border-border">
            <span className="text-primary font-bold cursor-pointer hover:underline text-sm">Monitor Grid &rarr;</span>
          </div>
        </div>

        <div className="card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-success text-white flex items-center justify-center shadow-lg">
            <FaLeaf size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Environmental Audits</h3>
            <p className="text-text-secondary text-sm">Track land usage, water-cleaning schedules, and carbon credit offsets.</p>
          </div>
          <div className="mt-auto pt-4 border-t border-border">
            <span className="text-primary font-bold cursor-pointer hover:underline text-sm">Open Audits &rarr;</span>
          </div>
        </div>

        <div className="card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg">
            <FaSolarPanel size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">SCADA Telemetry</h3>
            <p className="text-text-secondary text-sm">Track string inverter health, pyranometer solar irradiance, and active trackers.</p>
          </div>
          <div className="mt-auto pt-4 border-t border-border">
            <span className="text-primary font-bold cursor-pointer hover:underline text-sm">SCADA Panel &rarr;</span>
          </div>
        </div>

        {activeKey && (
          <div className="card p-6 md:col-span-3 flex flex-col gap-3 bg-gradient-to-r from-primary/[0.02] to-transparent border-l-4 border-l-primary">
            <h4 className="font-bold text-text-primary text-base">Grid Connection & SEC compliance ({config.name})</h4>
            <p className="text-text-secondary text-sm leading-relaxed">{config.infoMessage}</p>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <FaShieldAlt className="text-primary" />
                <span>Anti-Islanding Protection</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <FaBolt className="text-warning" />
                <span>Active Power Dispatch Limit</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
