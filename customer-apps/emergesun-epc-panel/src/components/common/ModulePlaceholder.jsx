import React from 'react';
import Breadcrumbs from '../../components/common/Breadcrumbs';

export default function ModulePlaceholder({ title, breadcrumb, icon, kpis, color = 'bg-amber-50 text-amber-600' }) {
  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: breadcrumb || title }]} />
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${color}`}>{icon}</div>
          <div>
            <h1 className="text-2xl font-bold text-solar-navy">{title}</h1>
            <p className="text-solar-slate text-sm mt-0.5">Overview & management console</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select className="select text-sm w-36"><option>Last 30 Days</option><option>Last 90 Days</option></select>
          <button className="btn-primary btn-sm">+ New Entry</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4 text-center">
            <div className="text-xl mb-1">{k.icon}</div>
            <div className="text-2xl font-bold text-solar-navy">{k.value}</div>
            <div className="text-xs text-solar-slate mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Placeholder Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-solar-border flex items-center justify-between">
          <h3 className="font-semibold text-solar-navy">Recent Records</h3>
          <div className="flex items-center gap-2">
            <input className="input text-sm w-48" placeholder="Search..." />
            <button className="btn-outline btn-sm">Filter</button>
            <button className="btn-outline btn-sm">Export</button>
          </div>
        </div>
        <div className="p-12 text-center">
          <div className="text-5xl mb-4">{icon}</div>
          <h3 className="text-lg font-semibold text-solar-navy mb-2">{title} Module</h3>
          <p className="text-solar-slate text-sm max-w-md mx-auto mb-4">
            This module is ready for backend integration. Connect your API endpoints to populate real-time data here.
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="badge-success">Frontend Ready</span>
            <span className="badge-warning">Backend Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}
