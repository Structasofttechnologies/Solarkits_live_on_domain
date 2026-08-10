// src/pages/inventory/InventoryPage.jsx
import { useState } from 'react';
import { Package, Plus, Search, AlertTriangle } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/tables/DataTable';
import { inventory } from '../../mocks/data';
import { formatCurrency } from '../../utils/formatters';
import { useSearch } from '../../hooks';
import { toast } from '../../hooks';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', ...new Set(inventory.map(i => i.category))];

  const filtered = useSearch(inventory, ['name', 'sku', 'brand', 'supplier'], search)
    .filter(i => categoryFilter === 'All' || i.category === categoryFilter);

  const lowStock = filtered.filter(i => i.stockStatus === 'low_stock');
  const outOfStock = filtered.filter(i => i.stockStatus === 'out_of_stock');

  const columns = [
    {
      key: 'name',
      title: 'Item',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-semibold text-navy text-sm">{row.name}</p>
          <p className="text-xs text-text-secondary font-mono">{row.sku}</p>
        </div>
      ),
    },
    { key: 'category', title: 'Category', render: v => <span className="text-xs text-text-secondary">{v}</span> },
    { key: 'brand', title: 'Brand', render: v => <span className="text-sm">{v}</span> },
    { key: 'quantity', title: 'Qty', sortable: true, align: 'center', render: v => <span className="text-sm font-bold text-navy">{v}</span> },
    { key: 'unit', title: 'Unit', render: v => <span className="text-xs text-text-muted">{v}</span> },
    { key: 'reorderLevel', title: 'Reorder At', sortable: true, align: 'center', render: v => <span className="text-xs text-text-secondary">{v}</span> },
    { key: 'unitCost', title: 'Unit Cost', sortable: true, align: 'right', render: v => <span className="text-sm font-medium">{formatCurrency(v)}</span> },
    { key: 'totalValue', title: 'Total Value', sortable: true, align: 'right', render: v => <span className="text-sm font-bold text-navy">{formatCurrency(v)}</span> },
    { key: 'stockStatus', title: 'Status', render: v => <Badge status={v} dot size="xs" /> },
    { key: 'location', title: 'Location', render: v => <span className="text-xs text-text-secondary">{v}</span> },
    {
      key: 'actions',
      title: '',
      render: (_, row) => (
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          <button className="text-xs text-solar font-medium hover:underline" onClick={() => toast.success(`Reorder placed for ${row.name}`)}>
            Reorder
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Spare Parts Inventory</h1>
          <p className="page-subtitle">Track and manage spare parts stock across all branches</p>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => toast.info('Adding inventory item...')}>
          Add Item
        </Button>
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="flex gap-3 flex-wrap">
          {outOfStock.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-danger-50 border border-danger/20 rounded-lg">
              <AlertTriangle size={15} className="text-danger" />
              <span className="text-sm font-medium text-danger">{outOfStock.length} items out of stock</span>
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-warning-50 border border-warning/20 rounded-lg">
              <AlertTriangle size={15} className="text-warning" />
              <span className="text-sm font-medium text-warning-700">{lowStock.length} items low on stock</span>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total SKUs', value: inventory.length, color: 'text-navy', bg: 'bg-navy/5' },
          { label: 'Total Value', value: `₹${(inventory.reduce((s, i) => s + i.totalValue, 0) / 100000).toFixed(1)}L`, color: 'text-success', bg: 'bg-success/5' },
          { label: 'Low Stock', value: lowStock.length, color: 'text-warning', bg: 'bg-warning/5' },
          { label: 'Out of Stock', value: outOfStock.length, color: 'text-danger', bg: 'bg-danger/5' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-lg p-4`}>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-text-secondary mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search items, SKU, brand..." />
          </div>
          <div className="flex gap-1 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)} className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors whitespace-nowrap ${categoryFilter === c ? 'bg-navy text-white border-navy' : 'bg-white text-text-secondary border-border hover:border-navy/30'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={filtered}
        emptyState={
          <div className="py-16 text-center">
            <Package size={40} className="text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">No inventory items found</p>
          </div>
        }
      />
    </div>
  );
}
