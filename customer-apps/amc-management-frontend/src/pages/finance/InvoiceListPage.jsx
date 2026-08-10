// src/pages/finance/InvoiceListPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Download } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/tables/DataTable';
import Pagination from '../../components/tables/Pagination';
import { invoices } from '../../mocks/data';
import { formatCurrency } from '../../utils/formatters';
import { usePagination, useSearch } from '../../hooks';
import { toast } from '../../hooks';

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = useSearch(invoices, ['customerName', 'invoiceId', 'contractId', 'billingPeriod'], search)
    .filter(i => statusFilter === 'All' || i.paymentStatus === statusFilter.toLowerCase());
  const { paginatedData, currentPage, totalPages, totalItems, goToPage } = usePagination(filtered, 15);

  const columns = [
    { key: 'invoiceId', title: 'Invoice ID', render: v => <span className="text-xs font-mono font-bold text-solar">{v}</span> },
    { key: 'customerName', title: 'Customer', sortable: true, render: (v, r) => <div><p className="text-sm font-medium text-navy">{v}</p><p className="text-xs text-text-secondary">{r.contractId}</p></div> },
    { key: 'billingPeriod', title: 'Period', render: v => <span className="text-sm text-text-secondary">{v}</span> },
    { key: 'issueDate', title: 'Issued', sortable: true, render: v => <span className="text-xs text-text-secondary">{v}</span> },
    { key: 'dueDate', title: 'Due', sortable: true, render: v => <span className="text-xs text-text-secondary">{v}</span> },
    { key: 'subtotal', title: 'Subtotal', align: 'right', render: v => <span className="text-sm">{formatCurrency(v)}</span> },
    { key: 'taxAmount', title: 'GST', align: 'right', render: v => <span className="text-sm text-text-secondary">{formatCurrency(v)}</span> },
    { key: 'totalAmount', title: 'Total', sortable: true, align: 'right', render: v => <span className="text-sm font-bold text-navy">{formatCurrency(v)}</span> },
    { key: 'paymentStatus', title: 'Status', render: v => <Badge status={v} dot size="xs" /> },
    { key: 'actions', title: '', render: (_, r) => (
      <div className="flex gap-1">
        <button className="text-xs text-solar font-medium hover:underline" onClick={e => { e.stopPropagation(); navigate(`/invoices/${r.id}`); }}>View</button>
        <span className="text-text-muted">|</span>
        <button className="text-xs text-text-secondary hover:underline" onClick={e => { e.stopPropagation(); toast.success('Downloading invoice...'); }}>PDF</button>
      </div>
    )},
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Invoices</h1><p className="page-subtitle">Manage all AMC invoices and payment tracking</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={() => toast.info('Exporting...')}>Export</Button>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => toast.info('Creating invoice...')}>Create Invoice</Button>
        </div>
      </div>
      <div className="card"><div className="card-body flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" /><input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search invoices..." /></div>
        {['All', 'paid', 'sent', 'overdue', 'partial', 'draft'].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors capitalize ${statusFilter === s ? 'bg-navy text-white border-navy' : 'bg-white text-text-secondary border-border'}`}>{s}</button>)}
      </div></div>
      <DataTable columns={columns} data={paginatedData} onRowClick={r => navigate(`/invoices/${r.id}`)} />
      <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={15} onPageChange={goToPage} />
    </div>
  );
}
