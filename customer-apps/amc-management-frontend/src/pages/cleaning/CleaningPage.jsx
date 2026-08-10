// src/pages/cleaning/CleaningPage.jsx
import { useState } from 'react';
import { Droplets, Plus, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { visits, sites } from '../../mocks/data';
import { formatDate, formatCapacity } from '../../utils/formatters';
import { toast } from '../../hooks';
import { BarChartWidget } from '../../components/charts/ChartWidgets';

const cleaningData = [
  { month: 'Aug', planned: 120, done: 112, efficiency: 18 },
  { month: 'Sep', planned: 130, done: 128, efficiency: 19 },
  { month: 'Oct', planned: 140, done: 136, efficiency: 21 },
  { month: 'Nov', planned: 125, done: 115, efficiency: 20 },
  { month: 'Dec', planned: 110, done: 104, efficiency: 17 },
  { month: 'Jan', planned: 145, done: 142, efficiency: 22 },
];

export default function CleaningPage() {
  const [view, setView] = useState('upcoming');
  const cleaningVisits = visits.filter(v => v.serviceType === 'panel_cleaning');
  const overdueCleans = sites.filter(s => {
    const daysSince = Math.floor((new Date() - new Date(s.lastCleaning)) / (1000 * 60 * 60 * 24));
    return daysSince > 45;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel Cleaning</h1>
          <p className="page-subtitle">Schedule and track panel cleaning visits for optimal performance</p>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => toast.info('Opening cleaning scheduler...')}>
          Schedule Cleaning
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Scheduled This Month', value: cleaningVisits.filter(v => v.status === 'scheduled').length, icon: Calendar, color: 'text-info', bg: 'bg-info/10' },
          { label: 'Completed This Month', value: cleaningVisits.filter(v => v.status === 'completed').length, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Overdue Sites', value: overdueCleans.length, icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Avg Days Since Last Clean', value: '28', icon: Clock, color: 'text-solar', bg: 'bg-solar/10', suffix: 'days' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>
              <k.icon size={20} className={k.color} />
            </div>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}{k.suffix ? ` ${k.suffix}` : ''}</p>
            <p className="text-xs text-text-secondary mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="card-title mb-4">Cleaning Completion vs Plan</h3>
          <BarChartWidget
            data={cleaningData}
            bars={[
              { key: 'planned', name: 'Planned', color: '#9FB3C8' },
              { key: 'done', name: 'Completed', color: '#22A06B' },
            ]}
            xKey="month"
            height={200}
          />
        </div>
        <div className="card p-5">
          <h3 className="card-title mb-4">Performance Gain from Cleaning (kWh/day avg)</h3>
          <BarChartWidget
            data={cleaningData}
            bars={[{ key: 'efficiency', name: 'Gain (kWh)', color: '#F9B233' }]}
            xKey="month"
            height={200}
          />
        </div>
      </div>

      {/* Overdue Sites */}
      {overdueCleans.length > 0 && (
        <div className="card">
          <div className="card-header px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning" />
              <h3 className="card-title">Sites Overdue for Cleaning (&gt;45 days)</h3>
            </div>
          </div>
          <div className="divide-y divide-border">
            {overdueCleans.slice(0, 6).map(site => {
              const days = Math.floor((new Date() - new Date(site.lastCleaning)) / (1000 * 60 * 60 * 24));
              return (
                <div key={site.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-navy">{site.name}</p>
                    <p className="text-xs text-text-secondary">{site.customerName} • {formatCapacity(site.capacity)}</p>
                    <p className="text-xs text-warning-600 mt-0.5">Last cleaned: {formatDate(site.lastCleaning)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-warning">{days}</p>
                      <p className="text-xxs text-text-muted">days ago</p>
                    </div>
                    <Button size="xs" variant="outline" onClick={() => toast.success(`Cleaning scheduled for ${site.name}`)}>
                      Schedule
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cleaning visits */}
      <div className="card">
        <div className="card-header px-5 py-4">
          <h3 className="card-title">Cleaning Schedule</h3>
          <div className="flex gap-1">
            {['upcoming', 'completed'].map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${view === v ? 'bg-solar text-white' : 'bg-gray-100 text-text-secondary'}`}>{v}</button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-border">
          {cleaningVisits.filter(v => view === 'upcoming' ? v.status === 'scheduled' : v.status === 'completed').map(v => (
            <div key={v.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <Droplets size={15} className="text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">{v.customerName}</p>
                  <p className="text-xs text-text-secondary">{v.siteName} • {v.technicianName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-medium text-navy">{formatDate(v.scheduledDate)}</p>
                  <p className="text-xs text-text-secondary">{v.scheduledTime}</p>
                </div>
                <Badge status={v.status} dot size="xs" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
