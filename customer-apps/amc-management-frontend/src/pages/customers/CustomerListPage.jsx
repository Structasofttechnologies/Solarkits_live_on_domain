// src/pages/customers/CustomerListPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Download, Users, Building2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/tables/DataTable';
import Pagination from '../../components/tables/Pagination';
import Drawer from '../../components/common/Drawer';
import EmptyState from '../../components/feedback/EmptyState';
import { customers } from '../../mocks/data';
import { formatDate, formatCurrency, formatCapacity, getInitials } from '../../utils/formatters';
import { usePagination, useSearch, useDebounce } from '../../hooks';
import { toast } from '../../hooks';
import { ALL_COUNTRIES, getCountryByName } from '../../constants';

const CUSTOMER_TYPES = ['All', 'Residential', 'Commercial', 'Industrial', 'Utility'];
const AMC_STATUS = ['All', 'Active', 'Expiring Soon', 'Expired', 'No AMC'];

export default function CustomerListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    type: 'commercial',
    contactPerson: '',
    email: '',
    phone: '',
    city: '',
    state: 'Gujarat',
    country: 'India'
  });


  const filtered = useSearch(customers, ['name', 'contactPerson', 'email', 'city', 'gstNumber'], search)
    .filter(c => typeFilter === 'All' || c.type === typeFilter.toLowerCase())
    .filter(c => statusFilter === 'All' || c.status.replace(/_/g, ' ') === statusFilter.toLowerCase());

  const { paginatedData, currentPage, totalPages, totalItems, goToPage } = usePagination(filtered, 10);

  const columns = [
    {
      key: 'name',
      title: 'Customer',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center shrink-0 text-xs font-bold text-navy">
            {getInitials(row.name)}
          </div>
          <div>
            <p className="font-semibold text-navy text-sm leading-snug">{row.name}</p>
            <p className="text-xs text-text-secondary">{row.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contactPerson',
      title: 'Contact',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium text-navy">{row.contactPerson}</p>
          <p className="text-xs text-text-secondary">{row.phone}</p>
        </div>
      ),
    },
    {
      key: 'city',
      title: 'Location',
      sortable: true,
      render: (_, row) => <span className="text-sm text-text-primary">{row.city}, {row.state}</span>,
    },
    {
      key: 'totalSites',
      title: 'Sites',
      sortable: true,
      align: 'center',
      render: (v) => <span className="text-sm font-semibold text-navy">{v}</span>,
    },
    {
      key: 'totalCapacity',
      title: 'Capacity',
      sortable: true,
      render: (v) => <span className="text-sm font-medium text-navy">{formatCapacity(v)}</span>,
    },
    {
      key: 'amcPlan',
      title: 'AMC Plan',
      render: (_, row) => {
        const planNames = { plan1: 'Basic AMC', plan2: 'Cleaning AMC', plan3: 'C+M AMC', plan4: 'Power Warranty' };
        return <span className="text-sm text-text-secondary">{planNames[row.amcPlan] || '—'}</span>;
      },
    },
    {
      key: 'status',
      title: 'Status',
      render: (v) => <Badge status={v === 'expiring_soon' ? 'expiring' : v} dot />,
    },
    {
      key: 'renewalDate',
      title: 'Renewal Date',
      sortable: true,
      render: (v) => <span className="text-sm text-text-secondary">{formatDate(v)}</span>,
    },
    {
      key: 'healthScore',
      title: 'Health',
      sortable: true,
      align: 'center',
      render: (v) => (
        <div className="flex items-center gap-1.5 justify-center">
          <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xxs font-bold"
            style={{ borderColor: v >= 90 ? '#22A06B' : v >= 70 ? '#F59E0B' : '#DC3545', color: v >= 90 ? '#22A06B' : v >= 70 ? '#F59E0B' : '#DC3545' }}>
            {v}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      title: '',
      fixedWidth: '80px',
      render: (_, row) => (
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/customers/${row.id}`)}
            className="px-2 py-1 text-xs text-solar font-medium hover:underline"
          >
            View
          </button>
        </div>
      ),
    },
  ];

  const handleAdd = () => {
    toast.success(`Customer "${addForm.name}" added successfully!`);
    setShowAddDrawer(false);
    setAddForm({ name: '', type: 'commercial', contactPerson: '', email: '', phone: '', city: '', state: 'Gujarat' });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage your AMC customer base and accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={() => toast.info('Export started...')}>
            Export
          </Button>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowAddDrawer(true)}>
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search customers, contact, email, GST..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CUSTOMER_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={[
                    'px-3 py-1.5 rounded text-xs font-medium transition-colors border',
                    typeFilter === t ? 'bg-navy text-white border-navy' : 'bg-white text-text-secondary border-border hover:border-navy/30',
                  ].join(' ')}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Summary stats */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-border flex-wrap">
            {[
              { label: 'Total', value: customers.length, color: 'text-navy' },
              { label: 'Active', value: customers.filter(c => c.status === 'active').length, color: 'text-success' },
              { label: 'Expiring Soon', value: customers.filter(c => c.status === 'expiring_soon').length, color: 'text-warning' },
              { label: 'Showing', value: filtered.length, color: 'text-info' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className={`text-base font-bold ${s.color}`}>{s.value}</span>
                <span className="text-xs text-text-secondary">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div>
        <DataTable
          columns={columns}
          data={paginatedData}
          onRowClick={row => navigate(`/customers/${row.id}`)}
          emptyState={
            <EmptyState
              icon={Users}
              title="No customers found"
              description="Add your first customer or try a different search filter."
              actionLabel="Add Customer"
              onAction={() => setShowAddDrawer(true)}
            />
          }
        />
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={10}
            onPageChange={goToPage}
          />
        </div>
      </div>

      {/* Add Customer Drawer */}
      <Drawer
        isOpen={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
        title="Add New Customer"
        subtitle="Create a new customer account"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddDrawer(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Save Customer</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Customer Name *</label>
            <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} className="form-input" placeholder="e.g. Sunrise Textile Industries" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Customer Type</label>
              <select value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))} className="form-select">
                {['residential', 'commercial', 'industrial', 'utility'].map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Category</label>
              <select className="form-select">
                {['Manufacturing', 'Healthcare', 'Education', 'Retail', 'Logistics', 'Government', 'IT/Technology', 'Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Contact Person *</label>
            <input value={addForm.contactPerson} onChange={e => setAddForm(f => ({ ...f, contactPerson: e.target.value }))} className="form-input" placeholder="Primary contact name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Email *</label>
              <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} className="form-input" placeholder="contact@company.com" />
            </div>
            <div>
              <label className="form-label">Phone *</label>
              <input type="tel" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} className="form-input" placeholder="9876543210" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Country</label>
              <select
                value={addForm.country}
                onChange={e => {
                  const countryName = e.target.value;
                  const cObj = getCountryByName(countryName);
                  setAddForm(f => ({
                    ...f,
                    country: countryName,
                    state: cObj.states ? cObj.states[0] : ''
                  }));
                }}
                className="form-select"
              >
                {ALL_COUNTRIES.map(c => (
                  <option key={c.code} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">State / Region</label>
              {(() => {
                const cObj = getCountryByName(addForm.country);
                return cObj.states && cObj.states.length > 0 ? (
                  <select
                    value={addForm.state}
                    onChange={e => setAddForm(f => ({ ...f, state: e.target.value }))}
                    className="form-select"
                  >
                    {cObj.states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input
                    value={addForm.state}
                    onChange={e => setAddForm(f => ({ ...f, state: e.target.value }))}
                    className="form-input"
                    placeholder="State"
                  />
                );
              })()}
            </div>
            <div>
              <label className="form-label">City</label>
              <input value={addForm.city} onChange={e => setAddForm(f => ({ ...f, city: e.target.value }))} className="form-input" placeholder="Rajkot" />
            </div>
          </div>

          <div>
            <label className="form-label">GST Number</label>
            <input className="form-input" placeholder="24AABCS1234A1Z5" />
          </div>
          <div>
            <label className="form-label">Assign Branch</label>
            <select className="form-select">
              <option>Rajkot HQ</option>
              <option>Ahmedabad Branch</option>
              <option>Surat Branch</option>
              <option>Mumbai Branch</option>
            </select>
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea rows={3} className="form-textarea" placeholder="Internal notes about this customer..." />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
