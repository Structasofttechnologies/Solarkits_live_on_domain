// src/pages/sites/SiteListPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Zap, Activity } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/tables/DataTable';
import Pagination from '../../components/tables/Pagination';
import EmptyState from '../../components/feedback/EmptyState';
import { sites } from '../../mocks/data';
import { formatDate, formatCapacity } from '../../utils/formatters';
import { usePagination, useSearch } from '../../hooks';
import { toast } from '../../hooks';

export default function SiteListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const filtered = useSearch(sites, ['name', 'customerName', 'city', 'inverterBrand', 'siteId'], search)
    .filter(s => typeFilter === 'All' || s.type === typeFilter.toLowerCase());

  const { paginatedData, currentPage, totalPages, totalItems, goToPage } = usePagination(filtered, 10);

  const columns = [
    {
      key: 'name',
      title: 'Site Name',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            row.monitoringStatus === 'healthy' ? 'bg-success/10' :
            row.monitoringStatus === 'warning' ? 'bg-warning/10' : 'bg-danger/10'
          }`}>
            <Zap size={15} className={
              row.monitoringStatus === 'healthy' ? 'text-success' :
              row.monitoringStatus === 'warning' ? 'text-warning' : 'text-danger'
            } />
          </div>
          <div>
            <p className="font-semibold text-navy text-sm">{row.name}</p>
            <p className="text-xs text-text-secondary font-mono">{row.siteId}</p>
          </div>
        </div>
      ),
    },
    { key: 'customerName', title: 'Customer', sortable: true, render: v => <span className="text-sm text-text-primary">{v}</span> },
    { key: 'city', title: 'Location', sortable: true, render: (_, r) => <span className="text-sm">{r.city}, {r.state}</span> },
    { key: 'type', title: 'Type', render: v => <Badge status={v} size="xs" /> },
    { key: 'capacity', title: 'Capacity', sortable: true, render: v => <span className="text-sm font-semibold text-navy">{formatCapacity(v)}</span> },
    { key: 'commissioningDate', title: 'Commissioned', sortable: true, render: v => <span className="text-sm text-text-secondary">{formatDate(v)}</span> },
    { key: 'inverterBrand', title: 'Inverter', render: v => <span className="text-sm text-text-secondary">{v}</span> },
    { key: 'amcStatus', title: 'AMC Status', render: v => <Badge status={v} dot size="xs" /> },
    { key: 'monitoringStatus', title: 'Monitoring', render: v => <Badge status={v} dot size="xs" /> },
    {
      key: 'activeFaults',
      title: 'Faults',
      align: 'center',
      render: v => (
        <span className={`text-sm font-bold ${v > 0 ? 'text-danger' : 'text-success'}`}>{v}</span>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Solar Sites</h1>
          <p className="page-subtitle">Manage all solar plant assets and their AMC status</p>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => toast.info('Add Site drawer opening...')}>
          Add Site
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Sites', value: sites.length, color: 'bg-navy/10', textColor: 'text-navy' },
          { label: 'Healthy', value: sites.filter(s => s.monitoringStatus === 'healthy').length, color: 'bg-success/10', textColor: 'text-success' },
          { label: 'Warning', value: sites.filter(s => s.monitoringStatus === 'warning').length, color: 'bg-warning/10', textColor: 'text-warning' },
          { label: 'With Active Faults', value: sites.filter(s => s.activeFaults > 0).length, color: 'bg-danger/10', textColor: 'text-danger' },
        ].map(k => (
          <div key={k.label} className={`${k.color} rounded-lg p-4`}>
            <p className={`text-2xl font-bold ${k.textColor}`}>{k.value}</p>
            <p className="text-xs text-text-secondary mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search sites, customers, inverter brands..." />
            </div>
            {['All', 'Residential', 'Commercial', 'Industrial', 'Utility'].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${typeFilter === t ? 'bg-navy text-white border-navy' : 'bg-white text-text-secondary border-border hover:border-navy/30'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={paginatedData} onRowClick={row => navigate(`/sites/${row.id}`)}
        emptyState={<EmptyState icon={Zap} title="No solar sites found" description="Add solar sites to manage their AMC contracts" actionLabel="Add Site" onAction={() => toast.info('Add Site drawer...')} />}
      />
      <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={10} onPageChange={goToPage} />
    </div>
  );
}
