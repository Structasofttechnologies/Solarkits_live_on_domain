import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2, Globe, Users, Package, Ban, CheckCircle, Building2, MoreVertical } from 'lucide-react';
import { companies } from '../../mocks/companies';
import { StatusBadge } from '../../components/common/Badges';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

export default function CompaniesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [data, setData] = useState(companies);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = data.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id) => {
    setData((prev) => prev.filter((c) => c.id !== id));
    setConfirmDelete(null);
    toast.success('Company removed successfully');
  };

  const handleToggleStatus = (id) => {
    setData((prev) => prev.map((c) => c.id === id ? { ...c, status: c.status === 'active' ? 'suspended' : 'active' } : c));
    toast.success('Company status updated');
  };

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: 'Company Management' }]} />
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-solar-navy">Company Management</h1>
          <p className="text-solar-slate text-sm mt-0.5">{data.length} EPC companies registered</p>
        </div>
        <button onClick={() => navigate('/companies/create')} className="btn-primary">
          <Plus size={16} /> Add Company
        </button>
      </div>

      {/* Search */}
      <div className="card p-4 mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-solar-slate" />
          <input className="input pl-9" placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select text-sm w-40">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <select className="select text-sm w-40">
          <option>All Plans</option>
          <option>Enterprise</option>
          <option>Professional</option>
          <option>Starter</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total Companies', value: data.length, icon: Building2, color: 'text-primary bg-primary-50' },
          { label: 'Active', value: data.filter((c) => c.status === 'active').length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Suspended', value: data.filter((c) => c.status === 'suspended').length, icon: Ban, color: 'text-red-600 bg-red-50' },
          { label: 'Total Users', value: data.reduce((s, c) => s + c.totalUsers, 0), icon: Users, color: 'text-blue-600 bg-blue-50' },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon size={18} />
            </div>
            <div>
              <div className="text-xl font-bold text-solar-navy">{s.value}</div>
              <div className="text-xs text-solar-slate">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Company</th>
                <th>Countries</th>
                <th>Users</th>
                <th>Products</th>
                <th>Plan</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-solar-slate">No companies found</td></tr>
              ) : filtered.map((company) => (
                <tr key={company.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">{company.code}</div>
                      <div>
                        <div className="font-medium text-solar-navy">{company.name}</div>
                        <div className="text-xs text-solar-slate">{company.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Globe size={13} className="text-solar-slate" />
                      <span className="text-sm">{company.operatingCountries.length} countries</span>
                    </div>
                    <div className="text-xs text-solar-slate mt-0.5">{company.operatingCountries.slice(0, 2).join(', ')}{company.operatingCountries.length > 2 ? '...' : ''}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Users size={13} className="text-solar-slate" />
                      <span className="text-sm font-medium">{company.totalUsers}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Package size={13} className="text-solar-slate" />
                      <span className="text-sm">{company.activeProducts.length}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${company.subscriptionPlan === 'Enterprise' ? 'badge-primary' : company.subscriptionPlan === 'Professional' ? 'badge-info' : 'badge-neutral'}`}>
                      {company.subscriptionPlan}
                    </span>
                  </td>
                  <td className="text-sm">{company.subscriptionExpiry}</td>
                  <td><StatusBadge status={company.status} /></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/companies/${company.id}`)} className="btn-icon btn-ghost btn-sm" title="View"><Eye size={15} /></button>
                      <button onClick={() => navigate(`/companies/${company.id}/edit`)} className="btn-icon btn-ghost btn-sm" title="Edit"><Edit2 size={15} /></button>
                      <button onClick={() => handleToggleStatus(company.id)} className="btn-icon btn-ghost btn-sm" title="Toggle Status">
                        {company.status === 'active' ? <Ban size={15} className="text-amber-500" /> : <CheckCircle size={15} className="text-green-500" />}
                      </button>
                      <button onClick={() => setConfirmDelete(company.id)} className="btn-icon btn-ghost btn-sm" title="Delete"><Trash2 size={15} className="text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Company"
        message="Are you sure you want to delete this company? This action cannot be undone and will remove all associated data."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
