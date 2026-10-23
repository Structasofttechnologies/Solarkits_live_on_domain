import React, { useMemo } from "react";
import Dialog from "../Dialog";
import Button from "../Button";
import {
  FiFileText,
  FiDownload,
  FiExternalLink,
  FiCheckCircle,
  FiAlertCircle,
  FiLayers,
  FiInfo
} from "react-icons/fi";
import { FaSolarPanel, FaBolt, FaBoxOpen } from "react-icons/fa";

const getComponentIcon = (type = "") => {
  const lower = type.toLowerCase();
  if (lower.includes("panel") || lower.includes("module") || lower.includes("pv")) {
    return FaSolarPanel;
  }
  if (lower.includes("inverter")) {
    return FaBolt;
  }
  return FaBoxOpen;
};

export default function DatasheetModal({ isOpen, onClose, kit }) {
  if (!kit) return null;

  // Gather all datasheets from kit.datasheet, kit.datasheets, panel, inverter, or includedComponents
  const datasheetList = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Primary ComboKit System Datasheet (uploaded via Admin)
    if (kit.datasheet) {
      seen.add(kit.datasheet);
      list.push({
        id: "combokit-system",
        productName: `${kit.kitName || kit.name || "Solar Combo Kit"} — System Datasheet`,
        brandName: kit.brand || "SolarKit",
        skuCode: "SYSTEM-BLUEPRINT",
        componentType: "Complete ComboKit Datasheet",
        datasheetUrl: kit.datasheet,
        hasDatasheet: true,
        quantity: 1,
        image: kit.kit_image
      });
    }

    if (kit.datasheets && Array.isArray(kit.datasheets) && kit.datasheets.length > 0) {
      kit.datasheets.forEach((item) => {
        if (item.datasheetUrl) {
          if (!seen.has(item.datasheetUrl)) {
            seen.add(item.datasheetUrl);
            list.push(item);
          }
        } else if (!list.some((l) => l.id === item.id)) {
          list.push(item);
        }
      });
      return list;
    }

    if (kit.panel) {
      const url = kit.panel.datasheet || null;
      list.push({
        id: "panel",
        productName: kit.panel.brandName ? `${kit.panel.brandName} Solar Panel` : "Tier-1 Solar PV Module",
        brandName: kit.panel.brandName || "Tier-1",
        componentType: "Solar Panel",
        datasheetUrl: url,
        hasDatasheet: !!url,
        quantity: kit.panel.quantity || kit.panel.panelCount || 0
      });
      if (url) seen.add(url);
    }

    if (kit.inverter) {
      const url = kit.inverter.datasheet || null;
      list.push({
        id: "inverter",
        productName: kit.inverter.brandName ? `${kit.inverter.brandName} Solar Inverter` : "Grid-Tie Solar Inverter",
        brandName: kit.inverter.brandName || "Tier-1",
        componentType: "Solar Inverter",
        datasheetUrl: url,
        hasDatasheet: !!url,
        quantity: kit.inverter.quantity || 1
      });
      if (url) seen.add(url);
    }

    if (kit.includedComponents && Array.isArray(kit.includedComponents)) {
      kit.includedComponents.forEach(comp => {
        if (!comp) return;
        const url = comp.datasheet || comp.datasheetUrl || null;
        if (url && seen.has(url)) return;
        if (url) seen.add(url);

        // Don't duplicate if already added panel/inverter
        const isPanel = comp.actualType === "panel" || comp.name?.toLowerCase().includes("panel");
        const isInverter = comp.actualType === "inverter" || comp.name?.toLowerCase().includes("inverter");
        if ((isPanel && kit.panel) || (isInverter && kit.inverter)) return;

        list.push({
          id: comp.id || comp.skuCode,
          productName: comp.name || "Component",
          brandName: comp.brandName || "",
          skuCode: comp.skuCode || "",
          componentType: comp.actualType === "panel" ? "Solar Panel" : comp.actualType === "inverter" ? "Inverter" : (comp.technologyType || "Balance of System"),
          datasheetUrl: url,
          hasDatasheet: !!url,
          quantity: comp.quantity || 1
        });
      });
    }

    return list;
  }, [kit]);

  const handleDownload = (url, name) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Datasheet.pdf`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Technical Datasheets & Documentation"
      size="lg"
    >
      <div className="space-y-6">
        {/* Kit Context Header */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-soft text-primary uppercase tracking-wider">
                {kit.capacityKW} kW ComboKit
              </span>
              {kit.brand && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-text-primary uppercase tracking-wider">
                  {kit.brand}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-text-primary">
              {kit.kitName || kit.name}
            </h3>
            <p className="text-xs text-text-secondary">
              Official manufacturer technical specifications, performance curves, and compliance sheets.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shrink-0">
            <FiCheckCircle size={15} />
            <span>MNRE & BIS Compliant</span>
          </div>
        </div>

        {/* Datasheet Components List */}
        {datasheetList.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-text-muted">
              <FiFileText size={28} />
            </div>
            <h4 className="text-sm font-bold text-text-primary">Datasheets on Request</h4>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Component datasheets for this custom configuration can be provided directly by our technical engineering team.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <FiLayers className="text-primary" /> Included Component Specifications ({datasheetList.length})
            </h4>

            <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden bg-surface">
              {datasheetList.map((item, idx) => {
                const Icon = getComponentIcon(item.componentType || item.productName);
                return (
                  <div
                    key={item.id || idx}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={18} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-text-secondary border border-border">
                            {item.componentType}
                          </span>
                          {item.brandName && (
                            <span className="text-[10px] font-bold text-text-primary">
                              {item.brandName}
                            </span>
                          )}
                          {item.skuCode && (
                            <span className="text-[10px] text-text-muted font-mono">
                              ({item.skuCode})
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs sm:text-sm font-bold text-text-primary">
                          {item.productName}
                        </h5>
                        {item.quantity > 0 && (
                          <p className="text-[11px] text-text-secondary">
                            Standard Kit Quantity: <span className="font-semibold text-text-primary">{item.quantity} Units</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {item.hasDatasheet && item.datasheetUrl ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => window.open(item.datasheetUrl, "_blank")}
                            leftIcon={<FiExternalLink size={13} />}
                            className="rounded-xl text-xs font-bold"
                            title="Preview PDF in browser tab"
                          >
                            View
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleDownload(item.datasheetUrl, item.productName)}
                            leftIcon={<FiDownload size={13} />}
                            className="rounded-xl text-xs font-bold"
                            title="Download official PDF"
                          >
                            Download
                          </Button>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-text-muted text-[11px] font-medium border border-border">
                          <FiInfo size={12} /> On Request
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="p-3 bg-primary-soft/40 border border-primary/10 rounded-xl flex items-start gap-2.5 text-xs text-text-secondary">
          <FiAlertCircle className="text-primary shrink-0 mt-0.5" size={15} />
          <p>
            All listed datasheets are official manufacturer documents. Warranty terms, efficiency tolerances, and peak operating curves are strictly governed by manufacturer standards.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
