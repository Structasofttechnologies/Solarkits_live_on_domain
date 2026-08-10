// src/pages/tickets/TicketListPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MessageSquare } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/tables/DataTable';
import Pagination from '../../components/tables/Pagination';
import { tickets } from '../../mocks/data';
import { formatDate, formatRelativeTime } from '../../utils/formatters';
import { usePagination, useSearch } from '../../hooks';
import { toast } from '../../hooks';

const STATUS_TABS = ['All', 'New', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Escalated'];
const PRIORITY_FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low'];

export default function TicketListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const filtered = useSearch(tickets, ['title', 'customerName', 'siteName', 'ticketId', 'assignedName'], search)
    .filter(t => statusTab === 'All' || t.status === statusTab.toLowerCase().replace(' ', '_'))
    .filter(t => priorityFilter === 'All' || t.priority === priorityFilter.toLowerCase());

  const { paginatedData, currentPage, totalPages, totalItems, goToPage } = usePagination(filtered, 12);

  const columns = [
    {
      key: 'ticketId',
      title: 'Ticket',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="text-xs font-mono font-bold text-solar">{row.ticketId}</p>
          <p className="text-xs text-text-muted mt-0.5">{formatRelativeTime(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'title',
      title: 'Issue',
      render: (_, row) => (
        <div>
          <p className="text-sm font-semibold text-navy max-w-[250px] line-clamp-1">{row.title}</p>
          <p className="text-xs text-text-secondary">{row.customerName} • {row.siteName}</p>
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Category',
      render: v => <span className="text-xs text-text-secondary capitalize">{v?.replace(/_/g, ' ')}</span>,
    },
    { key: 'priority', title: 'Priority', render: v => <Badge status={v} size="xs" /> },
    { key: 'status', title: 'Status', render: v => <Badge status={v} dot size="xs" /> },
    {
      key: 'assignedName',
      title: 'Assigned To',
      render: (v) => <span className="text-sm text-text-secondary">{v || 'Unassigned'}</span>,
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      render: v => <span className="text-xs text-text-secondary">{formatDate(v)}</span>,
    },
    {
      key: 'slaStatus',
      title: 'SLA',
      render: v => (
        <Badge
          status={v === 'breached' ? 'escalated' : v === 'at_risk' ? 'expiring' : 'healthy'}
          label={v?.replace('_', ' ')}
          size="xs"
        />
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Service Tickets</h1>
          <p className="page-subtitle">Track complaints, faults, and corrective maintenance requests</p>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => toast.info('Opening ticket creator...')}>
          Create Ticket
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: tickets.length, color: 'text-navy', bg: 'bg-navy/5' },
          { label: 'Open', value: tickets.filter(t => ['new', 'assigned', 'in_progress'].includes(t.status)).length, color: 'text-info', bg: 'bg-info/5' },
          { label: 'Escalated', value: tickets.filter(t => t.status === 'escalated').length, color: 'text-danger', bg: 'bg-danger/5' },
          { label: 'Resolved Today', value: tickets.filter(t => t.status === 'resolved').length, color: 'text-success', bg: 'bg-success/5' },
          { label: 'SLA Breached', value: tickets.filter(t => t.slaStatus === 'breached').length, color: 'text-warning', bg: 'bg-warning/5' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-lg p-4 text-center`}>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-text-secondary mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search tickets, customers, technicians..." />
            </div>
            {PRIORITY_FILTERS.map(p => (
              <button key={p} onClick={() => setPriorityFilter(p)} className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${priorityFilter === p ? 'bg-solar text-white border-solar' : 'bg-white text-text-secondary border-border hover:border-navy/30'}`}>
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUS_TABS.map(s => (
              <button key={s} onClick={() => setStatusTab(s)} className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors whitespace-nowrap ${statusTab === s ? 'bg-navy text-white border-navy' : 'bg-white text-text-secondary border-border hover:border-navy/30'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginatedData}
        onRowClick={row => navigate(`/tickets/${row.id}`)}
        emptyState={
          <div className="py-16 text-center">
            <MessageSquare size={40} className="text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">No tickets found</p>
          </div>
        }
      />
      <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={12} onPageChange={goToPage} />
    </div>
  );
}
