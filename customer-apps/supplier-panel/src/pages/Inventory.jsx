import React from "react";
import PageHeader from "../components/PageHeader";
import { FaWarehouse, FaExclamationTriangle, FaCheckCircle, FaHistory, FaArrowRight, FaBoxes } from "react-icons/fa";
import Button from "../components/Button";

export default function Inventory() {
  const inventorySummary = [
    { label: 'Total SKUs', value: '154', icon: <FaBoxes className="text-primary" /> },
    { label: 'Low Stock Items', value: '12', icon: <FaExclamationTriangle className="text-warning" /> },
    { label: 'Out of Stock', value: '03', icon: <FaExclamationTriangle className="text-danger" /> },
    { label: 'Warehouses', value: '04', icon: <FaWarehouse className="text-secondary" /> },
  ];

  const logs = [
    { action: 'Stock Inbound', item: '450W Panels', qty: '+500', user: 'System', date: '10m ago' },
    { action: 'Stock Outbound', item: '5kW Inverters', qty: '-20', user: 'Order-8821', date: '2h ago' },
    { action: 'Stock Correction', item: 'DC Cables', qty: '-5', user: 'Vikram S.', date: '5h ago' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Stock Infrastructure" 
        subtitle="Real-time inventory tracking and multi-warehouse logistics management." 
        icon={FaWarehouse}
        actions={
          <div className="flex gap-4">
            <Button variant="outline-primary" className="rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-widest" leftIcon={<FaHistory />}>
              Stock Ledger
            </Button>
            <Button variant="primary" className="rounded-xl h-12 px-8 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
              Reconcile Stock
            </Button>
          </div>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {inventorySummary.map((stat, idx) => (
          <div key={idx} className="card p-6 bg-surface border-border group hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <FaArrowRight className="text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="mt-6">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-text-primary mt-1 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inventory Logs */}
        <div className="lg:col-span-2 card bg-surface border-border overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Movement Logs</h3>
            <span className="text-[10px] font-black text-success uppercase bg-success/10 px-2 py-0.5 rounded-full border border-success/20">Live</span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-hover/50 text-[10px] font-black text-text-muted uppercase tracking-widest">
                  <th className="px-6 py-4">Transaction Type</th>
                  <th className="px-6 py-4">SKU / Item</th>
                  <th className="px-6 py-4">Adjustment</th>
                  <th className="px-6 py-4">Initiated By</th>
                  <th className="px-6 py-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-surface-hover/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-tight">{log.action}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-text-secondary">{log.item}</td>
                    <td className={`px-6 py-4 text-sm font-black ${log.qty.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                      {log.qty}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-text-muted">{log.user}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-text-muted uppercase">{log.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Warehouse Status */}
        <div className="card bg-surface border-border p-8 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-secondary/10 text-secondary flex items-center justify-center text-3xl shadow-inner">
            <FaWarehouse />
          </div>
          <div>
            <h4 className="text-xl font-black text-text-primary uppercase tracking-tight">Main Hub: Gurgaon</h4>
            <p className="text-xs font-bold text-text-muted mt-2 uppercase">Zone 4 Industrial Area</p>
          </div>
          <div className="w-full space-y-4 pt-4">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
              <span className="text-text-muted">Storage Capacity</span>
              <span className="text-text-primary">82% Full</span>
            </div>
            <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[82%]" />
            </div>
            <p className="text-[10px] text-text-secondary font-semibold leading-relaxed">
              Automated stock replenishment is active for primary SKUs.
            </p>
          </div>
          <Button variant="outline-primary" fullWidth className="rounded-xl h-12 font-black uppercase tracking-widest text-[10px]">
            Manage Locations
          </Button>
        </div>
      </div>
    </div>
  );
}
