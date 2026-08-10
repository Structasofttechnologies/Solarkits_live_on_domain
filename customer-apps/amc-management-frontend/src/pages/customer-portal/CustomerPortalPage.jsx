// src/pages/customer-portal/CustomerPortalPage.jsx
import { useState } from 'react';
import { Sun, Zap, FileText, Calendar, MessageSquare, Download, AlertTriangle, CheckCircle2, User } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { sites, contracts, visits, tickets, invoices } from '../../mocks/data';
import { formatCapacity, formatCurrency, formatDate } from '../../utils/formatters';
import { toast } from '../../hooks';

export default function CustomerPortalPage() {
  const [tab, setTab] = useState('dashboard');
  const customerSites = sites.slice(0, 2);
  const customerContracts = contracts.slice(0, 2);
  const customerVisits = visits.slice(0, 3);
  const customerTickets = tickets.slice(0, 2);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Portal Header */}
      <header className="bg-navy text-white px-6 py-4 flex items-center justify-between shadow-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-solar flex items-center justify-center">
            <Sun size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-base leading-tight">Emergesun Customer Portal</p>
            <p className="text-xxs text-navy-300">Solar Plant Performance & AMC Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-navy-200">Welcome, <strong>Rajesh Textile Mills</strong></span>
          <Button size="xs" variant="outline-primary" onClick={() => window.location.href = '/dashboard'}>
            Exit Portal
          </Button>
        </div>
      </header>

      {/* Subnav */}
      <div className="bg-white border-b border-border px-6 flex gap-6 text-sm font-medium">
        {[
          { id: 'dashboard', label: 'Overview & Performance' },
          { id: 'sites', label: 'My Solar Plants' },
          { id: 'contracts', label: 'AMC Contracts' },
          { id: 'service', label: 'Service History' },
          { id: 'tickets', label: 'Support & Tickets' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-3 border-b-2 transition-colors ${
              tab === t.id ? 'border-solar text-navy font-semibold' : 'border-transparent text-text-secondary hover:text-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Portal Body */}
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
        {tab === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Installed Power', value: '1.75 MWp', color: 'text-solar', icon: Zap },
                { label: "Today's Energy", value: '4,280 kWh', color: 'text-success', icon: CheckCircle2 },
                { label: 'Active AMC Contracts', value: '2 Plans', color: 'text-info', icon: FileText },
                { label: 'Open Support Tickets', value: '1 Ticket', color: 'text-warning', icon: MessageSquare },
              ].map(k => (
                <div key={k.label} className="card p-4">
                  <k.icon size={20} className={`${k.color} mb-2`} />
                  <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-xs text-text-secondary mt-1">{k.label}</p>
                </div>
              ))}
            </div>

            <div className="card p-5">
              <h3 className="text-base font-bold text-navy mb-4">My Solar Installations</h3>
              <div className="space-y-3">
                {customerSites.map(site => (
                  <div key={site.id} className="p-4 rounded-lg border border-border flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="font-bold text-navy text-sm">{site.name}</p>
                      <p className="text-xs text-text-secondary">{site.city} • {formatCapacity(site.capacity)} • {site.inverterBrand}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-solar">{site.currentGeneration} kW</p>
                        <p className="text-xxs text-text-muted">Live Power Output</p>
                      </div>
                      <Badge status={site.monitoringStatus} dot size="xs" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'contracts' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-navy">Active AMC Agreements</h3>
            {customerContracts.map(c => (
              <div key={c.id} className="card p-5 border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-navy">{c.planName}</h4>
                    <p className="text-xs text-text-secondary font-mono">{c.contractId}</p>
                  </div>
                  <Badge status={c.status} dot />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-3 text-xs bg-gray-50 p-3 rounded">
                  <div><span className="text-text-muted">Duration:</span> <p className="font-semibold text-navy">{formatDate(c.startDate)} to {formatDate(c.endDate)}</p></div>
                  <div><span className="text-text-muted">Value:</span> <p className="font-semibold text-navy">{formatCurrency(c.contractValue)}</p></div>
                  <div><span className="text-text-muted">Payment:</span> <p className="font-semibold text-success">{c.paymentStatus}</p></div>
                  <div><span className="text-text-muted">Capacity:</span> <p className="font-semibold text-navy">{formatCapacity(c.capacity)}</p></div>
                </div>
                <Button size="xs" variant="outline" leftIcon={<Download size={13} />} onClick={() => toast.success('Downloading agreement PDF...')}>
                  Download Agreement PDF
                </Button>
              </div>
            ))}
          </div>
        )}

        {tab === 'service' && (
          <div className="card p-5">
            <h3 className="text-base font-bold text-navy mb-4">Completed & Scheduled Maintenance</h3>
            <div className="space-y-3">
              {customerVisits.map(v => (
                <div key={v.id} className="p-3 border-b border-border flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-navy text-sm">{v.serviceType.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-text-secondary">Technician: {v.technicianName} • Date: {formatDate(v.scheduledDate)}</p>
                  </div>
                  <Badge status={v.status} dot size="xs" />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'tickets' && (
          <div className="card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-navy">Support Tickets</h3>
              <Button size="xs" onClick={() => toast.info('Opening ticket form...')}>+ Raise New Ticket</Button>
            </div>
            {customerTickets.map(t => (
              <div key={t.id} className="p-4 border border-border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs text-solar font-bold">{t.ticketId}</span>
                  <Badge status={t.status} dot size="xs" />
                </div>
                <p className="font-semibold text-navy text-sm">{t.title}</p>
                <p className="text-xs text-text-secondary mt-1">{t.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
