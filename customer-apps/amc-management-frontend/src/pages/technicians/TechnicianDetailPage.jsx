// src/pages/technicians/TechnicianDetailPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Phone, Mail, MapPin, Calendar, Wrench, CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { BarChartWidget } from '../../components/charts/ChartWidgets';
import { technicians, visits } from '../../mocks/data';
import { formatDate, getInitials } from '../../utils/formatters';
import { toast } from '../../hooks';

const mockPerf = [
  { month: 'Sep', completed: 28, target: 30 },
  { month: 'Oct', completed: 34, target: 30 },
  { month: 'Nov', completed: 29, target: 30 },
  { month: 'Dec', completed: 32, target: 30 },
  { month: 'Jan', completed: 35, target: 30 },
  { month: 'Feb', completed: 18, target: 30 },
];

export default function TechnicianDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Profile');

  const tech = technicians.find(t => t.id === id) || technicians[0];
  const techVisits = visits.filter(v => v.technicianId === tech.id).slice(0, 5);

  return (
    <div className="page-container">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/technicians')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} className="text-text-secondary" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-sm font-bold text-white">
              {getInitials(tech.name)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy">{tech.name}</h1>
              <div className="flex items-center gap-2">
                <Badge status={tech.status} dot size="xs" />
                <span className="text-xs text-text-secondary">{tech.specialization}</span>
                <span className="text-xxs text-text-muted">• {tech.employeeId}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Phone size={14} />} onClick={() => toast.info(`Calling ${tech.name}...`)}>
            Call
          </Button>
          <Button size="sm" leftIcon={<Calendar size={14} />} onClick={() => navigate('/schedule')}>
            Assign Job
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Jobs Completed', value: tech.completedJobs, color: 'text-navy', bg: 'bg-navy/5' },
          { label: 'Avg Rating', value: (tech.rating ?? 4.8).toFixed(1), color: 'text-solar', bg: 'bg-solar/5', icon: <Star size={14} className="text-solar fill-solar" /> },
          { label: 'Response Rate', value: `${tech.responseRate}%`, color: 'text-success', bg: 'bg-success/5' },
          { label: 'SLA Compliance', value: `${tech.slaCompliance}%`, color: 'text-info', bg: 'bg-info/5' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-lg p-4`}>
            <div className="flex items-center gap-1">
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              {k.icon}
            </div>
            <p className="text-xs text-text-secondary mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="tab-bar card">
        {['Profile', 'Job History', 'Performance', 'Certifications'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item ${activeTab === tab ? 'active' : ''}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-navy mb-4">Personal Information</h3>
            <div className="space-y-3">
              {[
                { icon: Phone, value: tech.phone },
                { icon: Mail, value: tech.email },
                { icon: MapPin, value: tech.zone },
                { icon: Calendar, label: 'Joined', value: formatDate(tech.joinedDate) },
                { icon: Wrench, label: 'Specialization', value: tech.specialization },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <item.icon size={15} className="text-text-muted shrink-0" />
                  <div>
                    {item.label && <p className="text-xxs text-text-muted">{item.label}</p>}
                    <p className="text-sm text-navy">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-navy mb-4">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {(tech.skills || ['Inverter Maintenance', 'Panel Cleaning', 'Electrical Work', 'Earthing', 'String Testing', 'IV Curve Analysis']).map(skill => (
                <span key={skill} className="text-xs px-2.5 py-1 bg-info/10 text-info-700 rounded-md font-medium">{skill}</span>
              ))}
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-navy mb-3">Performance Metrics</h3>
              <div className="space-y-3">
                {[
                  { label: 'Job Completion Rate', value: 96, color: 'bg-success' },
                  { label: 'On-Time Arrival', value: 88, color: 'bg-info' },
                  { label: 'Customer Satisfaction', value: 94, color: 'bg-solar' },
                  { label: 'First-Time Fix Rate', value: 82, color: 'bg-navy' },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary">{m.label}</span>
                      <span className="font-semibold text-navy">{m.value}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full">
                      <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Performance' && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">Monthly Jobs — Completed vs Target</h3>
          <BarChartWidget
            data={mockPerf}
            bars={[
              { key: 'completed', name: 'Completed', color: '#22A06B' },
              { key: 'target', name: 'Target', color: '#E8F0F7' },
            ]}
            xKey="month"
            height={250}
          />
        </div>
      )}

      {activeTab === 'Job History' && (
        <div className="card">
          <div className="card-header px-5 py-4">
            <h3 className="card-title">Recent Jobs</h3>
          </div>
          <div className="divide-y divide-border">
            {techVisits.map(v => (
              <div key={v.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-navy">{v.customerName}</p>
                  <p className="text-xs text-text-secondary">{v.siteName} • {v.serviceType.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-right">
                  <Badge status={v.status} size="xs" dot />
                  <p className="text-xs text-text-muted mt-1">{formatDate(v.scheduledDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Certifications' && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">Certifications & Training</h3>
          <div className="space-y-3">
            {(tech.certifications || []).map(cert => (
              <div key={cert} className="flex items-center gap-3 p-3 rounded-lg bg-success-50 border border-success/20">
                <CheckCircle2 size={16} className="text-success shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-navy">{cert}</p>
                  <p className="text-xs text-text-secondary">Verified Certification</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
