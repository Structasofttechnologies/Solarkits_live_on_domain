import React from "react";
import { useParams } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import { FaSolarPanel, FaUsers, FaChartPie, FaTools, FaFileSignature, FaMapMarkedAlt, FaGlobe } from "react-icons/fa";
import PageHeader from "@/components/PageHeader";

const DIY_COUNTRY_CONFIGS = {
  india: {
    code: "IN",
    name: "India",
    currency: "₹",
    themeBg: "bg-orange-500/10",
    borderClass: "border-orange-500/20",
    stats: [
      { label: "Active Projects", value: "842", description: "State subsidy linked" },
      { label: "New Leads", value: "115", description: "Last 24 hours" },
      { label: "Net Metering", value: "240 Approved", description: "DISCOM applications" },
      { label: "Surya Ghar", value: "98% Compliant", description: "Portal validation" }
    ],
    infoMessage: "Track DISCOM connections, net-metering approvals, and national subsidy submissions for DIY rooftop projects in India."
  },
  australia: {
    code: "AU",
    name: "Australia",
    currency: "A$",
    themeBg: "bg-blue-600/10",
    borderClass: "border-blue-600/20",
    stats: [
      { label: "Active Projects", value: "312", description: "CEC Compliant kits" },
      { label: "New Leads", value: "24", description: "Last 24 hours" },
      { label: "Grid Connection", value: "185 Logged", description: "DNSP applications" },
      { label: "STC Generation", value: "A$52K Claimed", description: "Clean Energy Regulator" }
    ],
    infoMessage: "Manage DNSP grid connections, Clean Energy Council compliant solar kit sales, and STC claims in Australia."
  },
  global: {
    code: "",
    name: "Global",
    currency: "$",
    themeBg: "bg-primary/10",
    borderClass: "border-primary/20",
    stats: [
      { label: "Active Projects", value: "156", description: "In progress" },
      { label: "New Leads", value: "42", description: "Last 24 hours" },
      { label: "Completion", value: "92%", description: "Success rate" },
      { label: "System health", value: "Optimal", description: "All systems go" }
    ],
    infoMessage: "Manage self-installed solar project leads and system configurations across all active markets."
  }
};

export default function Home() {
  const { countryName } = useParams();
  const activeKey = countryName?.toLowerCase();
  const config = DIY_COUNTRY_CONFIGS[activeKey] || DIY_COUNTRY_CONFIGS.global;

  return (
    <div className="min-h-screen space-y-6">
      <PageHeader
        title={`DIY Solar Dashboard - ${config.name}`}
        subtitle={`Manage self-installed solar project leads and system configurations in ${config.name}`}
        icon={FaSolarPanel}
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
          <div className="w-12 h-12 rounded-2xl gradient-primary text-white flex items-center justify-center shadow-lg">
            <FaUsers size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Customer Management</h3>
            <p className="text-text-secondary text-sm">Manage DIY enthusiasts and their project profiles in {config.name}.</p>
          </div>
          <div className="mt-auto pt-4 border-t border-border">
            <span className="text-primary font-bold cursor-pointer hover:underline text-sm">View Customers &rarr;</span>
          </div>
        </div>

        <div className="card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-success text-white flex items-center justify-center shadow-lg">
            <FaChartPie size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Sales Analytics</h3>
            <p className="text-text-secondary text-sm">Track kit sales and component upgrades in {config.name}.</p>
          </div>
          <div className="mt-auto pt-4 border-t border-border">
            <span className="text-primary font-bold cursor-pointer hover:underline text-sm">Open Reports &rarr;</span>
          </div>
        </div>

        <div className="card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-lg">
            <FaTools size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Toolbox & Guides</h3>
            <p className="text-text-secondary text-sm">Manage installation manuals and configuration builders.</p>
          </div>
          <div className="mt-auto pt-4 border-t border-border">
            <span className="text-primary font-bold cursor-pointer hover:underline text-sm">Edit Guides &rarr;</span>
          </div>
        </div>

        {activeKey && (
          <div className="card p-6 md:col-span-3 flex flex-col gap-3 bg-gradient-to-r from-primary/[0.02] to-transparent border-l-4 border-l-primary">
            <h4 className="font-bold text-text-primary text-base">Country Compliance Information ({config.name})</h4>
            <p className="text-text-secondary text-sm leading-relaxed">{config.infoMessage}</p>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <FaFileSignature className="text-primary" />
                <span>Subsidy Approvals</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <FaMapMarkedAlt className="text-primary" />
                <span>Grid Connections</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
