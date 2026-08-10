// src/pages/monitoring/MonitoringDashboardPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Zap, AlertTriangle, CheckCircle2, TrendingDown, Search } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AreaChartWidget } from '../../components/charts/ChartWidgets';
import { sites } from '../../mocks/data';
import { formatCapacity, formatEnergy, formatPercentage } from '../../utils/formatters';
import { useSearch } from '../../hooks';

const portfolioTrend = [
  { time: '6AM', power: 0 }, { time: '7AM', power: 240 }, { time: '8AM', power: 680 },
  { time: '9AM', power: 1240 }, { time: '10AM', power: 1780 }, { time: '11AM', power: 2140 },
  { time: '12PM', power: 2280 }, { time: '1PM', power: 2190 }, { time: '2PM', power: 2050 },
  { time: '3PM', power: 1820 }, { time: '4PM', power: 1420 }, { time: '5PM', power: 840 },
  { time: '6PM', power: 280 }, { time: '7PM', power: 0 },
];

export default function MonitoringDashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = useSearch(sites, ['name', 'customerName', 'city'], search)
    .filter(s => statusFilter === 'All' || s.monitoringStatus === statusFilter.toLowerCase());

  const totalPower = sites.reduce((sum, s) => sum + s.currentGeneration, 0);
  const totalEnergy = sites.reduce((sum, s) => sum + s.todayGeneration, 0);
  const faults = sites.filter(s => s.activeFaults > 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Remote Monitoring</h1>
          <p className="page-subtitle">Real-time visibility into your entire solar portfolio</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-success-50 border border-success/20 rounded-full text-xs font-medium text-success">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            LIVE — Updated 30s ago
          </span>
        </div>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Portfolio Power Now', value: `${(totalPower / 1000).toFixed(1)} MW`, icon: Zap, color: 'text-solar', bg: 'bg-solar/10', live: true },
          { label: "Today's Energy", value: formatEnergy(totalEnergy), icon: Activity, color: 'text-success', bg: 'bg-success/10', live: true },
          { label: 'Sites with Faults', value: faults.length, icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10' },
          { label: 'Avg Availability', value: formatPercentage(sites.reduce((sum, s) => sum + s.availability, 0) / sites.length), icon: CheckCircle2, color: 'text-info', bg: 'bg-info/10' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon size={20} className={k.color} />
              </div>
              {k.live && <span className="text-xxs font-bold text-success bg-success-50 px-1.5 py-0.5 rounded">LIVE</span>}
            </div>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-text-secondary mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Portfolio Power Curve */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-title">Portfolio Power Output — Today</h3>
          <span className="text-xs text-text-secondary">Aggregated from {sites.length} sites</span>
        </div>
        <AreaChartWidget
          data={portfolioTrend}
          areas={[{ key: 'power', name: 'Power (kW)', color: '#F9B233' }]}
          xKey="time"
          height={200}
        />
      </div>

      {/* Site Grid */}
      <div>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search sites..." />
          </div>
          {['All', 'healthy', 'warning', 'critical', 'offline'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors capitalize ${statusFilter === s ? 'bg-navy text-white border-navy' : 'bg-white text-text-secondary border-border hover:border-navy/30'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(site => (
            <div
              key={site.id}
              className={`card border-l-4 cursor-pointer hover:shadow-card-md transition-all ${
                site.monitoringStatus === 'healthy' ? 'border-l-success' :
                site.monitoringStatus === 'warning' ? 'border-l-warning' :
                site.monitoringStatus === 'critical' ? 'border-l-danger' : 'border-l-gray-400'
              }`}
              onClick={() => navigate(`/monitoring/${site.id}`)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-navy text-sm truncate">{site.name}</p>
                    <p className="text-xs text-text-secondary truncate">{site.customerName}</p>
                  </div>
                  <Badge status={site.monitoringStatus} dot size="xs" />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-xxs text-text-muted">Current Power</p>
                    <p className="text-base font-bold text-solar">{site.currentGeneration} kW</p>
                  </div>
                  <div>
                    <p className="text-xxs text-text-muted">Today's Generation</p>
                    <p className="text-base font-bold text-success">{(site.todayGeneration / 1000).toFixed(1)} MWh</p>
                  </div>
                  <div>
                    <p className="text-xxs text-text-muted">Capacity</p>
                    <p className="text-sm font-semibold text-navy">{formatCapacity(site.capacity)}</p>
                  </div>
                  <div>
                    <p className="text-xxs text-text-muted">PR</p>
                    <p className="text-sm font-semibold text-navy">{formatPercentage(site.pr)}</p>
                  </div>
                </div>

                {site.activeFaults > 0 && (
                  <div className="flex items-center gap-1.5 p-2 bg-danger-50 border border-danger/20 rounded text-xs text-danger">
                    <AlertTriangle size={12} />
                    <span className="font-medium">{site.activeFaults} active fault{site.activeFaults !== 1 ? 's' : ''}</span>
                  </div>
                )}

                {/* Mini power bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xxs text-text-muted mb-1">
                    <span>Capacity utilization</span>
                    <span>{Math.round((site.currentGeneration / site.capacity) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full">
                    <div
                      className={`h-full rounded-full ${site.monitoringStatus === 'healthy' ? 'bg-success' : site.monitoringStatus === 'warning' ? 'bg-warning' : 'bg-danger'}`}
                      style={{ width: `${Math.min(100, Math.round((site.currentGeneration / site.capacity) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
