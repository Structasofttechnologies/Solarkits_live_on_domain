import React, { useState } from 'react';
import { Search, Filter, Download, Eye } from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { auditLogs } from '../../mocks/index';
import { StatusBadge } from '../../components/common/Badges';

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ module: '', action: '', result: '' });
  const [drawer, setDrawer] = useState(null);

  const filtered = auditLogs.filter((l) => {
    const matchSearch = l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.module.toLowerCase().includes(search.toLowerCase());
    const matchModule = !filters.module || l.module === filters.module;
    const matchAction = !filters.action || l.action === filters.action;
    const matchResult = !filters.result || l.result === filters.result;
    return matchSearch && matchModule && matchAction && matchResult;
  });

  const modules = [...new Set(auditLogs.map((l) => l.module))];
  const actions = [...new Set(auditLogs.map((l) => l.action))];

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: 'Audit Logs' }]} />
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-solar-navy">Audit Logs</h1>
          <p className="text-solar-slate text-sm mt-0.5">Track all administrative actions and system events</p>
        </div>
        <button className="btn-outline btn-sm"><Download size={14} /> Export Logs</button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-solar-slate" />
          <input className="input pl-9" placeholder="Search by user, module, action..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select text-sm w-44" value={filters.module} onChange={(e) => setFilters((f) => ({ ...f, module: e.target.value }))}>
          <option value="">All Modules</option>
          {modules.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select className="select text-sm w-36" value={filters.action} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}>
          <option value="">All Actions</option>
          {actions.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select className="select text-sm w-36" value={filters.result} onChange={(e) => setFilters((f) => ({ ...f, result: e.target.value }))}>
          <option value="">All Results</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
          <option value="error">Error</option>
        </select>
        <input type="date" className="input text-sm w-40" />
        <input type="date" className="input text-sm w-40" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>User</th>
                <th>Role</th>
                <th>Company</th>
                <th>Module</th>
                <th>Action</th>
                <th>Target</th>
                <th>IP</th>
                <th>Device</th>
                <th>Result</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td className="text-xs font-mono whitespace-nowrap">{log.dateTime}</td>
                  <td>
                    <div className="font-medium text-solar-navy text-sm">{log.user}</div>
                  </td>
                  <td className="text-xs text-solar-slate">{log.role}</td>
                  <td className="text-xs">{log.company}</td>
                  <td>
                    <span className="badge-info text-xs">{log.module}</span>
                  </td>
                  <td>
                    <span className={`badge text-xs ${
                      log.action === 'Delete' ? 'bg-red-50 text-red-600 border-red-200' :
                      log.action === 'Create' ? 'bg-green-50 text-green-600 border-green-200' :
                      log.action === 'Edit' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                      'badge-neutral'
                    }`}>{log.action}</span>
                  </td>
                  <td className="text-xs max-w-[160px] truncate">{log.target}</td>
                  <td className="text-xs font-mono text-solar-slate">{log.ip}</td>
                  <td className="text-xs text-solar-slate">{log.device}</td>
                  <td><StatusBadge status={log.result} /></td>
                  <td>
                    <button onClick={() => setDrawer(log)} className="btn-icon btn-ghost btn-sm" title="View Details">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-solar-border text-sm text-solar-slate">
          Showing {filtered.length} of {auditLogs.length} log entries
        </div>
      </div>

      {/* Detail Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 animate-fade-in" onClick={() => setDrawer(null)}>
          <div className="bg-white w-full max-w-sm h-full shadow-2xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-solar-navy">Log Detail</h3>
              <button onClick={() => setDrawer(null)} className="text-solar-slate hover:text-solar-navy">✕</button>
            </div>
            <div className="space-y-3">
              {[
                ['Date & Time', drawer.dateTime], ['User', drawer.user], ['Role', drawer.role],
                ['Company', drawer.company], ['Country', drawer.country], ['Module', drawer.module],
                ['Action', drawer.action], ['Target', drawer.target], ['IP Address', drawer.ip],
                ['Device', drawer.device], ['Result', drawer.result], ['Details', drawer.details],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-gray-100 pb-2">
                  <div className="text-xs text-solar-slate mb-0.5">{k}</div>
                  <div className="text-sm font-medium text-solar-navy">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
