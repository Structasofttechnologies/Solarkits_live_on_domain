// src/pages/maintenance/MaintenancePage.jsx
import { useState } from 'react';
import { Wrench, Plus, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { visits, sites } from '../../mocks/data';
import { formatDate, formatCapacity } from '../../utils/formatters';
import { toast } from '../../hooks';
import { BarChartWidget } from '../../components/charts/ChartWidgets';

const checklist = [
  { item: 'Visual inspection of all panels', category: 'Module', critical: true },
  { item: 'Clean panel surface', category: 'Module', critical: false },
  { item: 'Check module mounting clamps', category: 'Module', critical: true },
  { item: 'Test inverter output voltage/current', category: 'Inverter', critical: true },
  { item: 'Check inverter cooling fan', category: 'Inverter', critical: false },
  { item: 'Verify inverter error logs', category: 'Inverter', critical: true },
  { item: 'Test earth continuity', category: 'Safety', critical: true },
  { item: 'Inspect ACDB/DCDB fuses', category: 'Electrical', critical: true },
  { item: 'Test string voltage and current', category: 'Electrical', critical: true },
  { item: 'Check MC4 connectors for corrosion', category: 'Electrical', critical: false },
  { item: 'Test SPD (surge protection)', category: 'Safety', critical: true },
  { item: 'Verify monitoring data accuracy', category: 'Monitoring', critical: false },
];

const mttrData = [
  { month: 'Sep', planned: 12, corrective: 5 },
  { month: 'Oct', planned: 15, corrective: 3 },
  { month: 'Nov', planned: 11, corrective: 7 },
  { month: 'Dec', planned: 13, corrective: 4 },
  { month: 'Jan', planned: 16, corrective: 6 },
  { month: 'Feb', planned: 14, corrective: 2 },
];

export default function MaintenancePage() {
  const [category, setCategory] = useState('All');
  const pmVisits = visits.filter(v => v.serviceType === 'preventive_maintenance');
  const categories = ['All', 'Module', 'Inverter', 'Safety', 'Electrical', 'Monitoring'];

  const filteredChecklist = category === 'All' ? checklist : checklist.filter(c => c.category === category);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Preventive Maintenance</h1>
          <p className="page-subtitle">Manage scheduled PM visits and digital inspection checklists</p>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => toast.info('Scheduling maintenance...')}>
          Schedule PM
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'PM Visits This Month', value: pmVisits.length, icon: Wrench, color: 'text-navy', bg: 'bg-navy/10' },
          { label: 'Completed', value: pmVisits.filter(v => v.status === 'completed').length, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Pending', value: pmVisits.filter(v => v.status === 'scheduled').length, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Issues Found', value: 14, icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>
              <k.icon size={20} className={k.color} />
            </div>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-text-secondary mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="card-title mb-4">PM vs Corrective Maintenance Visits</h3>
          <BarChartWidget
            data={mttrData}
            bars={[
              { key: 'planned', name: 'Preventive', color: '#2878C8' },
              { key: 'corrective', name: 'Corrective', color: '#DC3545' },
            ]}
            xKey="month"
            height={200}
          />
        </div>
        <div className="card p-5">
          <h3 className="card-title mb-4">PM Digital Checklist</h3>
          <p className="text-xs text-text-secondary mb-3">Standard checklist for preventive maintenance visits</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`px-2 py-1 rounded text-xxs font-medium transition-colors border ${category === c ? 'bg-navy text-white border-navy' : 'bg-white text-text-secondary border-border'}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredChecklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${item.critical ? 'border-danger/40' : 'border-border'}`}>
                  <CheckCircle2 size={11} className="text-success opacity-0" />
                </div>
                <span className="text-xs text-text-primary">{item.item}</span>
                {item.critical && <span className="text-xxs text-danger font-medium ml-auto shrink-0">*Required</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PM Schedule */}
      <div className="card">
        <div className="card-header px-5 py-4">
          <h3 className="card-title">Upcoming PM Visits</h3>
        </div>
        <div className="divide-y divide-border">
          {pmVisits.slice(0, 6).map(v => (
            <div key={v.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                  <Wrench size={15} className="text-info" />
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
