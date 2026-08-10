import React from "react";
import { useParams } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import { FaFileContract, FaWrench, FaHeartbeat, FaClock, FaCheckCircle, FaGlobe, FaTools } from "react-icons/fa";
import PageHeader from "@/components/PageHeader";

const AMC_COUNTRY_CONFIGS = {
  india: {
    code: "IN",
    name: "India",
    currency: "₹",
    stats: [
      { label: "Active Contracts", value: "1,450", description: "Rooftop & commercial" },
      { label: "Preventive Visits", value: "180 Checked", description: "This month" },
      { label: "Renewals Pending", value: "45 Sites", description: "Next 30 days" },
      { label: "SLA Compliance", value: "97.8%", description: "Response rate" }
    ],
    infoMessage: "Track state-wise AMC compliance, consumer grievance redressal SLAs, and dispatch schedules for localized maintenance teams in India."
  },
  australia: {
    code: "AU",
    name: "Australia",
    currency: "A$",
    stats: [
      { label: "Active Contracts", value: "380", description: "Residential & commercial" },
      { label: "CEC Inspections", value: "42 Audited", description: "Compliance check" },
      { label: "Renewals Pending", value: "12 Sites", description: "Next 30 days" },
      { label: "SLA Compliance", value: "99.2%", description: "Clean Energy standards" }
    ],
    infoMessage: "Manage annual safety inspections, Clean Energy Council performance audits, and inverter manufacturer warranty renewals in Australia."
  },
  global: {
    code: "",
    name: "Global",
    currency: "$",
    stats: [
      { label: "Total Contracts", value: "850", description: "Global markets" },
      { label: "Open Tickets", value: "14", description: "Pending response" },
      { label: "System Health", value: "99.5%", description: "Uptime guarantee" },
      { label: "SLA Compliance", value: "98.5%", description: "Average response time" }
    ],
    infoMessage: "Manage global service contracts, maintenance SLAs, client profiles, and asset performance tracking."
  }
};

export default function Home() {
  const { countryName } = useParams();
  const activeKey = countryName?.toLowerCase();
  const config = AMC_COUNTRY_CONFIGS[activeKey] || AMC_COUNTRY_CONFIGS.global;

  return (
    <div className="min-h-screen space-y-6">
      <PageHeader
        title={`Solar AMC Dashboard - ${config.name}`}
        subtitle={`Manage maintenance contracts, preventive logs, and safety audits in ${config.name}`}
        icon={FaFileContract}
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
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
            <FaWrench size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Maintenance Scheduling</h3>
            <p className="text-text-secondary text-sm">Create and dispatch service technicians to site visits.</p>
          </div>
          <div className="mt-auto pt-4 border-t border-border">
            <span className="text-primary font-bold cursor-pointer hover:underline text-sm">Schedule Visit &rarr;</span>
          </div>
        </div>

        <div className="card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-success text-white flex items-center justify-center shadow-lg">
            <FaHeartbeat size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Asset Telemetry</h3>
            <p className="text-text-secondary text-sm">Real-time performance checks and active error codes.</p>
          </div>
          <div className="mt-auto pt-4 border-t border-border">
            <span className="text-primary font-bold cursor-pointer hover:underline text-sm">Open Telemetry &rarr;</span>
          </div>
        </div>

        <div className="card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-lg">
            <FaTools size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Spare Parts Inventory</h3>
            <p className="text-text-secondary text-sm">Manage modules, inverter cards, and cable stock level alerts.</p>
          </div>
          <div className="mt-auto pt-4 border-t border-border">
            <span className="text-primary font-bold cursor-pointer hover:underline text-sm">View Spares &rarr;</span>
          </div>
        </div>

        {activeKey && (
          <div className="card p-6 md:col-span-3 flex flex-col gap-3 bg-gradient-to-r from-primary/[0.02] to-transparent border-l-4 border-l-primary">
            <h4 className="font-bold text-text-primary text-base">Annual Maintenance Standards ({config.name})</h4>
            <p className="text-text-secondary text-sm leading-relaxed">{config.infoMessage}</p>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <FaCheckCircle className="text-success" />
                <span>Thermal Scanning</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <FaClock className="text-primary" />
                <span>SLA Audits</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
