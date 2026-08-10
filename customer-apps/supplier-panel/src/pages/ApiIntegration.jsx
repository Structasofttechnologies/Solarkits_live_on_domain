import React from "react";
import PageHeader from "../components/PageHeader";
import { FaRocket, FaTerminal, FaKey, FaBook, FaCopy, FaCheckCircle, FaCloud, FaSync } from "react-icons/fa";
import Button from "../components/Button";
import { motion } from "framer-motion";

export default function ApiIntegration() {
  const credentials = [
    { label: 'API Key (Development)', value: 'es_dev_8821_4492_xk39', status: 'Active' },
    { label: 'Webhook Secret', value: 'wh_sec_9921_lk02_p912', status: 'Active' },
  ];

  const endpoints = [
    { method: 'GET', path: '/v1/inventory/skus', desc: 'Fetch full product list' },
    { method: 'POST', path: '/v1/orders/sync', desc: 'Push order updates' },
    { method: 'PUT', path: '/v1/pricing/bulk', desc: 'Update tiered pricing' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Developer API & Ecosystem" 
        subtitle="Integrate your ERP or internal warehouse systems directly with the EmergeSun marketplace." 
        icon={FaTerminal}
        actions={
          <div className="flex gap-4">
            <Button variant="outline-primary" className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-xs" leftIcon={<FaBook />}>
              Open API Reference
            </Button>
            <Button variant="primary" className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20" leftIcon={<FaSync />}>
              Regenerate Keys
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* API Credentials */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card p-8 bg-surface border-border">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight mb-8">Access Infrastructure</h3>
            <div className="space-y-6">
              {credentials.map((cred, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">{cred.label}</label>
                    <span className="text-[10px] font-black text-success uppercase">{cred.status}</span>
                  </div>
                  <div className="relative group">
                    <div className="w-full h-14 bg-surface-hover border-2 border-border rounded-2xl flex items-center px-6 font-mono text-sm text-text-secondary overflow-hidden">
                      {cred.value}
                    </div>
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-surface border border-border text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                      <FaCopy />
                    </button>
                  </div>
                </div>
              ))}
              <div className="pt-4">
                <Button variant="primary" className="rounded-xl h-12 px-10 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20" leftIcon={<FaSync />}>
                  Regenerate Keys
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Endpoints */}
          <div className="card p-8 bg-surface border-border">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight mb-6">Core API Endpoints</h3>
            <div className="space-y-4">
              {endpoints.map((ep, idx) => (
                <div key={idx} className="flex items-center gap-6 p-4 rounded-2xl bg-surface-hover/50 border border-border group hover:border-primary/30 transition-all cursor-pointer">
                  <span className={`w-16 text-center text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                    ep.method === 'GET' ? 'bg-success/10 text-success' : ep.method === 'POST' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                  }`}>
                    {ep.method}
                  </span>
                  <code className="text-sm font-black text-text-primary flex-1">{ep.path}</code>
                  <p className="text-xs font-bold text-text-muted uppercase">{ep.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Docs & Integration Status */}
        <div className="space-y-6">
          <div className="card bg-surface border-border p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl mx-auto">
              <FaBook />
            </div>
            <div>
              <h4 className="text-xl font-black text-text-primary uppercase tracking-tight">Full Documentation</h4>
              <p className="text-sm font-semibold text-text-secondary mt-2">
                Learn how to authenticate and consume the EmergeSun Supplier API.
              </p>
            </div>
            <Button variant="outline-primary" fullWidth className="rounded-xl h-14 font-black uppercase tracking-widest text-xs">
              Open API Reference
            </Button>
          </div>

          <div className="card bg-surface border-border p-8">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight mb-6">System Health</h3>
            <div className="space-y-6">
              {[
                { label: 'API Gateway', status: 'Healthy', icon: <FaCheckCircle className="text-success" /> },
                { label: 'Webhook Engine', status: 'Operational', icon: <FaCheckCircle className="text-success" /> },
                { label: 'Sync Latency', status: '12ms', icon: <FaCloud className="text-primary" /> },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-xs font-black text-text-primary uppercase tracking-tight">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-black text-text-muted uppercase">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
