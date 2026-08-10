// src/pages/technicians/TechnicianListPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, MapPin, Star, User } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { technicians } from '../../mocks/data';
import { useSearch } from '../../hooks';
import { toast } from '../../hooks';
import { getInitials } from '../../utils/formatters';

export default function TechnicianListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = useSearch(technicians, ['name', 'specialization', 'zone', 'employeeId', 'email'], search)
    .filter(t => statusFilter === 'All' || t.status === statusFilter.toLowerCase().replace(' ', '_'));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Technicians</h1>
          <p className="page-subtitle">Manage your field service team and their assignments</p>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => toast.info('Adding technician...')}>
          Add Technician
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Technicians', value: technicians.length, color: 'text-navy', bg: 'bg-navy/5' },
          { label: 'Available Now', value: technicians.filter(t => t.status === 'available').length, color: 'text-success', bg: 'bg-success/5' },
          { label: 'On Job', value: technicians.filter(t => t.status === 'on_job').length, color: 'text-info', bg: 'bg-info/5' },
          { label: 'On Leave', value: technicians.filter(t => t.status === 'on_leave').length, color: 'text-warning', bg: 'bg-warning/5' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-lg p-4`}>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-text-secondary mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search technicians..." />
        </div>
        {['All', 'Available', 'On Job', 'On Leave'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-navy text-white border-navy' : 'bg-white text-text-secondary border-border hover:border-navy/30'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Technician Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(tech => (
          <div
            key={tech.id}
            className="card hover:shadow-card-md cursor-pointer transition-all border hover:border-solar/20"
            onClick={() => navigate(`/technicians/${tech.id}`)}
          >
            <div className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {getInitials(tech.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-navy truncate">{tech.name}</p>
                    <Badge status={tech.status} dot size="xs" />
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{tech.specialization}</p>
                  <p className="text-xxs text-text-muted font-mono">{tech.employeeId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div>
                  <p className="text-text-muted">Experience</p>
                  <p className="font-semibold text-navy mt-0.5">{tech.experience} yrs</p>
                </div>
                <div>
                  <p className="text-text-muted">Zone</p>
                  <p className="font-semibold text-navy mt-0.5 truncate">{tech.zone}</p>
                </div>
                <div>
                  <p className="text-text-muted">Completed Jobs</p>
                  <p className="font-semibold text-navy mt-0.5">{tech.completedJobs}</p>
                </div>
                <div>
                  <p className="text-text-muted">Avg Rating</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={12} className="text-solar fill-solar" />
                    <span className="font-semibold text-navy">{(tech.rating ?? 4.8).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-text-secondary border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <Phone size={11} className="text-text-muted" />
                  {tech.phone}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={11} className="text-text-muted" />
                  {tech.currentLocation || tech.zone}
                </div>
              </div>

              {tech.certifications?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                  {tech.certifications.slice(0, 3).map(cert => (
                    <span key={cert} className="text-xxs px-1.5 py-0.5 bg-info/10 text-info-700 rounded">{cert}</span>
                  ))}
                  {tech.certifications.length > 3 && (
                    <span className="text-xxs text-text-muted">+{tech.certifications.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <User size={40} className="text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-muted">No technicians found</p>
        </div>
      )}
    </div>
  );
}
