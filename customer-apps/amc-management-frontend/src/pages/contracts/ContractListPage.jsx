// src/pages/contracts/ContractListPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Download } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/tables/DataTable';
import Pagination from '../../components/tables/Pagination';
import { contracts } from '../../mocks/data';
import { formatDate, formatCurrency, formatCapacity } from '../../utils/formatters';
import { usePagination, useSearch } from '../../hooks';
import { toast } from '../../hooks';

const STATUS_TABS = ['All', 'Active', 'Expiring Soon', 'Draft', 'Expired', 'Suspended', 'Cancelled'];

export default function ContractListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('All');

  const filtered = useSearch(contracts, ['customerName', 'siteName', 'planName', 'contractId'], search)
    .filter(c => statusTab === 'All' || 
      (statusTab === 'Expiring Soon' && c.renewalStatus === 'due_soon') ||
      c.status === statusTab.toLowerCase().replace(' ', '_'));

  const { paginatedData, currentPage, totalPages, totalItems, goToPage } = usePagination(filtered, 10);

  const columns = [
    {
      key: 'contractId',
      title: 'Contract ID',
      sortable: true,
      render: v => <span className="text-xs font-mono font-semibold text-navy">{v}</span>,
    },
    {
      key: 'customerName',
      title: 'Customer',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="text-sm font-semibold text-navy">{row.customerName}</p>
          <p className="text-xs text-text-secondary">{row.siteName}</p>
        </div>
      ),
    },
    { key: 'planName', title: 'Plan', render: v => <span className="text-sm text-text-secondary">{v}</span> },
    { key: 'capacity', title: 'Capacity', render: v => <span className="text-sm font-medium text-navy">{formatCapacity(v)}</span> },
    { key: 'startDate', title: 'Start', sortable: true, render: v => <span className="text-sm text-text-secondary">{formatDate(v)}</span> },
    {
      key: 'endDate',
      title: 'End Date',
      sortable: true,
      render: (v, row) => (
        <span className={`text-sm font-medium ${row.renewalStatus === 'due_soon' ? 'text-warning-700' : 'text-text-secondary'}`}>
          {formatDate(v)}
        </span>
      ),
    },
    {
      key: 'contractValue',
      title: 'Value',
      sortable: true,
      align: 'right',
      render: v => <span className="text-sm font-bold text-navy">{formatCurrency(v)}</span>,
    },
    { key: 'paymentStatus', title: 'Payment', render: v => <Badge status={v} size="xs" dot /> },
    {
      key: 'status',
      title: 'Status',
      render: (v, row) => (
        <div className="flex flex-col gap-1">
          <Badge status={v} dot size="xs" />
          {row.renewalStatus === 'due_soon' && <Badge status="expiring" size="xs" label="Renewal Due" />}
        </div>
      ),
    },
    {
      key: 'actions',
      title: '',
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/contracts/${row.id}`); }}
          className="text-xs text-solar font-medium hover:underline"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">AMC Contracts</h1>
          <p className="page-subtitle">Manage all AMC agreements and their lifecycle</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={() => toast.info('Exporting contracts...')}>
            Export
          </Button>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate('/contracts/new')}>
            Create Contract
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Contracts', value: contracts.length, color: 'text-navy', bg: 'bg-navy/5' },
          { label: 'Active', value: contracts.filter(c => c.status === 'active').length, color: 'text-success', bg: 'bg-success/5' },
          { label: 'Renewal Due', value: contracts.filter(c => c.renewalStatus === 'due_soon').length, color: 'text-warning', bg: 'bg-warning/5' },
          { label: 'Overdue Payments', value: contracts.filter(c => c.paymentStatus === 'overdue').length, color: 'text-danger', bg: 'bg-danger/5' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-lg p-4`}>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-text-secondary mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search contracts, customers, plans..." />
            </div>
            <div className="tab-bar border-0 gap-1">
              {STATUS_TABS.map(t => (
                <button key={t} onClick={() => setStatusTab(t)} className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors whitespace-nowrap ${statusTab === t ? 'bg-navy text-white border-navy' : 'bg-white text-text-secondary border-border hover:border-navy/30'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={paginatedData} onRowClick={row => navigate(`/contracts/${row.id}`)} />
      <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={10} onPageChange={goToPage} />
    </div>
  );
}
