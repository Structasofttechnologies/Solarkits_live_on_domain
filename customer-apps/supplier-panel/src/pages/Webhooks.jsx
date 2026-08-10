import React from "react";
import PageHeader from "../components/PageHeader";
import { FaTerminal, FaLink, FaHistory, FaPlus, FaCheckCircle, FaExclamationTriangle, FaHourglassHalf, FaPlay } from "react-icons/fa";
import Button from "../components/Button";
import { motion } from "framer-motion";

export default function Webhooks() {
  const hooks = [
    { event: 'order.created', url: 'https://erp.supplier.com/hooks/new-order', status: 'Active', count: 1240 },
    { event: 'inventory.low', url: 'https://erp.supplier.com/hooks/stock-alert', status: 'Active', count: 85 },
    { event: 'payout.processed', url: 'https://erp.supplier.com/hooks/finance', status: 'Paused', count: 12 },
  ];

  const recentDeliveries = [
    { id: 'EV-8821', event: 'order.created', status: 'Success', code: 200, time: '5m ago' },
    { id: 'EV-8819', event: 'order.created', status: 'Retrying', code: 503, time: '12m ago' },
    { id: 'EV-8815', event: 'inventory.low', status: 'Success', code: 200, time: '1h ago' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Webhook Subscriptions" 
        subtitle="Receive real-time notifications for marketplace events directly in your system." 
        icon={FaLink}
        actions={
          <Button 
            variant="primary" 
            className="rounded-xl font-bold text-xs uppercase tracking-widest h-12 shadow-lg shadow-primary/20 px-8"
            leftIcon={<FaPlus />}
          >
            Add Endpoint
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Hooks */}
        <div className="lg:col-span-2 space-y-6">
          {hooks.map((hook, idx) => (
            <div key={idx} className="card p-8 bg-surface border-border group hover:border-primary/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6 flex-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                  hook.status === 'Active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}>
                  <FaLink />
                </div>
                <div className="space-y-1 truncate">
                  <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">{hook.event}</h3>
                  <p className="text-xs font-mono text-text-muted truncate">{hook.url}</p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Deliveries</p>
                  <p className="text-lg font-black text-text-primary tracking-tight">{hook.count.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline-primary" className="rounded-xl h-10 w-10 p-0 flex items-center justify-center">
                    <FaPlay className="text-xs" />
                  </Button>
                  <Button variant="outline-secondary" className="rounded-xl h-10 px-4 font-black uppercase tracking-widest text-[10px]">
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Test Console Placeholder */}
          <div className="card p-8 bg-surface border-border bg-slate-900/5 dark:bg-slate-900/40">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight mb-6">Webhook Test Console</h3>
            <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm text-green-400 space-y-2 overflow-x-auto border border-slate-700 shadow-inner">
              <p className="opacity-50"># Waiting for event selection...</p>
              <p><span className="text-purple-400">$</span> es-cli trigger order.created --id=TEST_ORD_9921</p>
              <p className="text-yellow-400"># Sending payload to https://erp.supplier.com/hooks/new-order</p>
              <p>HTTP/1.1 <span className="text-white">200 OK</span></p>
              <p className="text-slate-500">{"{"} "event": "order.created", "data": {"{ ... }"} {"}"}</p>
            </div>
          </div>
        </div>

        {/* Delivery Logs */}
        <div className="card bg-surface border-border flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Delivery History</h3>
            <FaHistory className="text-primary" />
          </div>
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {recentDeliveries.map((log, idx) => (
              <div key={idx} className="flex gap-4 group">
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border border-border/50 ${
                  log.status === 'Success' ? 'bg-success/10 text-success' : log.status === 'Retrying' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                }`}>
                  {log.status === 'Success' ? <FaCheckCircle /> : <FaHourglassHalf />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-text-primary uppercase tracking-tight">{log.event}</p>
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{log.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{log.id}</p>
                    <span className={`text-[10px] font-black uppercase ${log.code === 200 ? 'text-success' : 'text-warning'}`}>HTTP {log.code}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-border mt-auto">
            <Button variant="outline-primary" fullWidth className="rounded-xl h-12 font-black uppercase tracking-widest text-[10px]">
              View Full Logs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
