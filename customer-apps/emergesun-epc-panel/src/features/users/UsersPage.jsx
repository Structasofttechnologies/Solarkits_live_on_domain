import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Download, Eye, Edit2, UserX, UserCheck, Key, Trash2, RefreshCw, Upload } from 'lucide-react';
import { users as mockUsers } from '../../mocks/users';
import { StatusBadge, RoleBadge, Avatar } from '../../components/common/Badges';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [data, setData] = useState(mockUsers);
  const [selected, setSelected] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const [filterDrawer, setFilterDrawer] = useState(false);
  const [filters, setFilters] = useState({ status: '', role: '', country: '' });

  const filtered = data.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filters.status || u.status === filters.status;
    const matchRole = !filters.role || u.roleCode === filters.role;
    const matchCountry = !filters.country || u.country === filters.country;
    return matchSearch && matchStatus && matchRole && matchCountry;
  });

  const toggleSelect = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map((u) => u.id));

  const doAction = (action, userId) => {
    if (action === 'delete') {
      setData((prev) => prev.filter((u) => u.id !== userId));
      toast.success('User deleted successfully');
    } else if (action === 'suspend') {
      setData((prev) => prev.map((u) => u.id === userId ? { ...u, status: 'suspended' } : u));
      toast.success('User suspended');
    } else if (action === 'activate') {
      setData((prev) => prev.map((u) => u.id === userId ? { ...u, status: 'active' } : u));
      toast.success('User activated');
    }
    setConfirmAction(null);
  };

  const kpis = [
    { label: 'Total Users', value: data.length, color: 'text-primary' },
    { label: 'Active', value: data.filter((u) => u.status === 'active').length, color: 'text-green-600' },
    { label: 'Inactive', value: data.filter((u) => u.status === 'inactive').length, color: 'text-amber-600' },
    { label: 'Suspended', value: data.filter((u) => u.status === 'suspended').length, color: 'text-red-600' },
  ];

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: 'EPC Users' }]} />
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-solar-navy">EPC Users</h1>
          <p className="text-solar-slate text-sm mt-0.5">{data.length} users across all companies</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline btn-sm"><Upload size={14} /> Import</button>
          <button className="btn-outline btn-sm"><Download size={14} /> Export</button>
          <button onClick={() => navigate('/users/create')} className="btn-primary btn-sm"><Plus size={14} /> Add User</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4 text-center">
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-solar-slate mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-solar-slate" />
          <input className="input pl-9" placeholder="Search by name, email, employee ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select text-sm w-36" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <select className="select text-sm w-40" value={filters.role} onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}>
          <option value="">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="EPC_ADMIN">EPC Admin</option>
          <option value="COUNTRY_ADMIN">Country Admin</option>
          <option value="SALES">Sales</option>
          <option value="SUPPORT">Support</option>
          <option value="OPERATIONS">Operations</option>
        </select>
        <select className="select text-sm w-40" value={filters.country} onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}>
          <option value="">All Countries</option>
          {['India', 'United States', 'United Arab Emirates', 'United Kingdom', 'Australia', 'Germany', 'South Africa', 'Singapore'].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button onClick={() => setFilters({ status: '', role: '', country: '' })} className="btn-ghost btn-sm text-xs">
          <RefreshCw size={13} /> Reset
        </button>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-primary-50 border border-primary-200 rounded-xl">
          <span className="text-sm font-medium text-primary">{selected.length} selected</span>
          <button className="btn-sm btn-outline" onClick={() => { toast.success(`${selected.length} users activated`); setSelected([]); }}>Activate</button>
          <button className="btn-sm btn-outline text-amber-600 border-amber-300 hover:bg-amber-50" onClick={() => { toast.success(`${selected.length} users suspended`); setSelected([]); }}>Suspend</button>
          <button className="btn-sm btn-danger" onClick={() => { toast.success(`${selected.length} users deleted`); setSelected([]); }}>Delete</button>
          <button className="ml-auto btn-ghost btn-sm" onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="w-10">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll} className="w-4 h-4 rounded border-gray-300" />
                </th>
                <th>User</th>
                <th>Company</th>
                <th>Country</th>
                <th>Role</th>
                <th>Products</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-solar-slate">
                  <div className="text-4xl mb-2">🔍</div>No users found matching your criteria.
                </td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)}
                      className="w-4 h-4 rounded border-gray-300" />
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <div className="font-medium text-solar-navy">{u.name}</div>
                        <div className="text-xs text-solar-slate">{u.employeeId} · {u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm max-w-[120px] truncate">{u.company}</td>
                  <td className="text-sm">{u.country}</td>
                  <td><RoleBadge role={u.role} code={u.roleCode} /></td>
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                      {u.products.slice(0, 2).map((p) => <span key={p} className="badge-neutral text-xs">{p}</span>)}
                      {u.products.length > 2 && <span className="text-xs text-solar-slate">+{u.products.length - 2}</span>}
                    </div>
                  </td>
                  <td className="text-xs text-solar-slate">{u.lastLogin}</td>
                  <td><StatusBadge status={u.status} /></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/users/${u.id}`)} className="btn-icon btn-ghost btn-sm" title="View"><Eye size={14} /></button>
                      <button onClick={() => navigate(`/users/${u.id}/edit`)} className="btn-icon btn-ghost btn-sm" title="Edit"><Edit2 size={14} /></button>
                      {u.status === 'active' ? (
                        <button onClick={() => setConfirmAction({ action: 'suspend', id: u.id, name: u.name })}
                          className="btn-icon btn-ghost btn-sm" title="Suspend"><UserX size={14} className="text-amber-500" /></button>
                      ) : (
                        <button onClick={() => doAction('activate', u.id)}
                          className="btn-icon btn-ghost btn-sm" title="Activate"><UserCheck size={14} className="text-green-500" /></button>
                      )}
                      <button className="btn-icon btn-ghost btn-sm" title="Reset Password"><Key size={14} className="text-blue-500" /></button>
                      <button onClick={() => setConfirmAction({ action: 'delete', id: u.id, name: u.name })}
                        className="btn-icon btn-ghost btn-sm" title="Delete"><Trash2 size={14} className="text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-solar-border">
          <span className="text-sm text-solar-slate">Showing {filtered.length} of {data.length} users</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((p) => (
              <button key={p} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === 1 ? 'bg-primary text-white' : 'text-solar-slate hover:bg-gray-100'}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.action === 'delete' ? 'Delete User' : 'Suspend User'}
        message={confirmAction?.action === 'delete'
          ? `Are you sure you want to permanently delete ${confirmAction?.name}? This action cannot be undone.`
          : `Are you sure you want to suspend ${confirmAction?.name}? They will lose access to the platform.`}
        confirmLabel={confirmAction?.action === 'delete' ? 'Delete' : 'Suspend'}
        variant="danger"
        onConfirm={() => doAction(confirmAction.action, confirmAction.id)}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
