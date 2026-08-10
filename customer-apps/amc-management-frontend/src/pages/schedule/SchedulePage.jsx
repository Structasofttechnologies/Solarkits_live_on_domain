// src/pages/schedule/SchedulePage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, ChevronLeft, ChevronRight, List, Grid, Filter, Clock, MapPin, User, Wrench, Droplets } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { visits } from '../../mocks/data';
import { formatDate, formatTime } from '../../utils/formatters';
import { toast } from '../../hooks';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const serviceTypeConfig = {
  preventive_maintenance: { icon: Wrench, color: 'bg-info/15 text-info border-info/20' },
  panel_cleaning: { icon: Droplets, color: 'bg-success/15 text-success border-success/20' },
  corrective_maintenance: { icon: Wrench, color: 'bg-danger/15 text-danger border-danger/20' },
  installation_inspection: { icon: Wrench, color: 'bg-warning/15 text-warning border-warning/20' },
};

export default function SchedulePage() {
  const navigate = useNavigate();
  const [view, setView] = useState('list');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const filtered = visits.filter(v =>
    (statusFilter === 'All' || v.status === statusFilter.toLowerCase()) &&
    (typeFilter === 'All' || v.serviceType === typeFilter)
  );

  const grouped = filtered.reduce((acc, v) => {
    const date = v.scheduledDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(v);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Visit Scheduling</h1>
          <p className="page-subtitle">Plan, assign, and track service visits across all AMC contracts</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            {[['list', List], ['grid', Grid]].map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-colors ${view === v ? 'bg-navy text-white' : 'text-text-secondary hover:bg-gray-50'}`}>
                <Icon size={14} />
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => toast.info('Opening visit scheduler...')}>
            Schedule Visit
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Visits', value: visits.length, color: 'text-navy', bg: 'bg-navy/5' },
          { label: 'Scheduled', value: visits.filter(v => v.status === 'scheduled').length, color: 'text-info', bg: 'bg-info/5' },
          { label: 'Completed', value: visits.filter(v => v.status === 'completed').length, color: 'text-success', bg: 'bg-success/5' },
          { label: 'In Progress', value: visits.filter(v => v.status === 'in_progress').length, color: 'text-warning', bg: 'bg-warning/5' },
          { label: 'Missed', value: visits.filter(v => v.status === 'missed').length, color: 'text-danger', bg: 'bg-danger/5' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-lg p-4 text-center`}>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-text-secondary mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body flex flex-wrap gap-3">
          <div className="flex gap-1">
            {['All', 'scheduled', 'in_progress', 'completed', 'missed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors capitalize ${statusFilter === s ? 'bg-navy text-white border-navy' : 'bg-white text-text-secondary border-border hover:border-navy/30'}`}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="flex gap-1 border-l border-border pl-3">
            {['All', 'preventive_maintenance', 'panel_cleaning', 'corrective_maintenance'].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${typeFilter === t ? 'bg-solar text-white border-solar' : 'bg-white text-text-secondary border-border hover:border-navy/30'}`}>
                {t === 'All' ? 'All Types' : t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).substring(0, 12)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visit List grouped by date */}
      <div className="space-y-6">
        {sortedDates.map(date => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-bold text-navy">{formatDate(date)}</span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted">{grouped[date].length} visit{grouped[date].length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {grouped[date].map(visit => {
                const svcConf = serviceTypeConfig[visit.serviceType] || serviceTypeConfig.preventive_maintenance;
                const ServiceIcon = svcConf.icon;
                return (
                  <div
                    key={visit.id}
                    className={`card border-l-4 ${visit.status === 'completed' ? 'border-l-success' : visit.status === 'missed' ? 'border-l-danger' : visit.status === 'in_progress' ? 'border-l-warning' : 'border-l-info'} hover:shadow-card-md cursor-pointer transition-all`}
                    onClick={() => toast.info(`Opening visit ${visit.visitId}...`)}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded text-xxs font-semibold border ${svcConf.color}`}>
                            <ServiceIcon size={11} className="inline mr-1" />
                            {visit.serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        </div>
                        <Badge status={visit.status} size="xs" dot />
                      </div>
                      <p className="font-bold text-navy text-sm mb-0.5">{visit.customerName}</p>
                      <p className="text-xs text-text-secondary mb-3">{visit.siteName}</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <Clock size={12} className="text-text-muted" />
                          {visit.scheduledTime} {visit.estimatedDuration ? `• ${visit.estimatedDuration}h est.` : ''}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <User size={12} className="text-text-muted" />
                          {visit.technicianName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <MapPin size={12} className="text-text-muted" />
                          {visit.location}
                        </div>
                      </div>
                      {visit.notes && (
                        <p className="text-xs text-text-muted mt-2 italic border-t border-border pt-2">{visit.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {sortedDates.length === 0 && (
          <div className="py-16 text-center">
            <Calendar size={40} className="text-text-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-navy">No visits found for the selected filters</p>
            <Button className="mt-4" size="sm" onClick={() => { setStatusFilter('All'); setTypeFilter('All'); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
