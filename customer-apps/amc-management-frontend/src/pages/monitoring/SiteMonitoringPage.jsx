// src/pages/monitoring/SiteMonitoringPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Activity, AlertTriangle } from 'lucide-react';
import { sites } from '../../mocks/data';
import { AreaChartWidget } from '../../components/charts/ChartWidgets';
import Badge from '../../components/common/Badge';
import { formatCapacity, formatPercentage } from '../../utils/formatters';

const hourlyData = Array.from({ length: 14 }, (_, i) => ({
  time: `${6 + i}:00`,
  power: i < 1 ? 0 : i < 7 ? i * 310 + Math.random() * 100 : (14 - i) * 280 + Math.random() * 80,
}));

export default function SiteMonitoringPage() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const site = sites.find(s => s.id === siteId) || sites[0];

  return (
    <div className="page-container">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/monitoring')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} className="text-text-secondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-navy">{site.name} — Live Monitoring</h1>
          <p className="text-sm text-text-secondary">{site.customerName} • {formatCapacity(site.capacity)}</p>
        </div>
        <Badge status={site.monitoringStatus} dot />
        <span className="text-xs text-success bg-success-50 border border-success/20 px-2 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft" />
          LIVE
        </span>
      </div>

      {/* Live Parameters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Current Power', value: `${site.currentGeneration} kW`, color: 'text-solar', bg: 'bg-solar/10' },
          { label: "Today's Energy", value: `${(site.todayGeneration / 1000).toFixed(2)} MWh`, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Performance Ratio', value: formatPercentage(site.pr), color: 'text-info', bg: 'bg-info/10' },
          { label: 'Active Faults', value: site.activeFaults, color: site.activeFaults > 0 ? 'text-danger' : 'text-success', bg: site.activeFaults > 0 ? 'bg-danger/10' : 'bg-success/10' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-lg p-4`}>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-text-secondary mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Inverter-level data */}
      <div className="card p-5">
        <h3 className="card-title mb-4">Inverter Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: site.inverterCount }, (_, i) => ({
            id: `INV-${String(i + 1).padStart(2, '0')}`,
            power: Math.round((site.currentGeneration / site.inverterCount) * (0.95 + Math.random() * 0.1)),
            voltage: Math.round(390 + Math.random() * 20),
            status: i === 0 && site.activeFaults > 0 ? 'warning' : 'healthy',
          })).map(inv => (
            <div key={inv.id} className={`flex items-center justify-between p-3 rounded-lg border ${inv.status === 'healthy' ? 'border-success/20 bg-success/3' : 'border-warning/20 bg-warning/3'}`}>
              <div>
                <p className="text-sm font-bold text-navy">{inv.id}</p>
                <p className="text-xs text-text-secondary">{site.inverterBrand}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-solar">{inv.power} kW</p>
                <p className="text-xs text-text-secondary">{inv.voltage} V</p>
              </div>
              <Badge status={inv.status} dot size="xs" />
            </div>
          ))}
        </div>
      </div>

      {/* Power curve */}
      <div className="card p-5">
        <h3 className="card-title mb-4">Power Curve — Today</h3>
        <AreaChartWidget
          data={hourlyData}
          areas={[{ key: 'power', name: 'Power (kW)', color: '#F9B233' }]}
          xKey="time"
          height={250}
        />
      </div>
    </div>
  );
}
