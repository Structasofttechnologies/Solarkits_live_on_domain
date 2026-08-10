import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit2, Copy, Trash2, Users, Shield, ChevronDown, ChevronRight } from 'lucide-react';
import { roles as mockRoles } from '../../mocks/roles';
import { StatusBadge, RoleBadge } from '../../components/common/Badges';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

const MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'company-management', label: 'Company Management' },
  { id: 'country-administration', label: 'Country Administration' },
  { id: 'user-management', label: 'User Management' },
  { id: 'role-management', label: 'Role Management' },
  { id: 'residential-solar', label: 'Residential Solar' },
  { id: 'commercial-solar', label: 'Commercial Solar' },
  { id: 'solar-shop', label: 'Solar E-Shop' },
  { id: 'procurement', label: 'Procurement' },
  { id: 'crm', label: 'CRM' },
  { id: 'order-management', label: 'Order Management' },
  { id: 'service-support', label: 'Service & Support' },
  { id: 'reports-analytics', label: 'Reports & Analytics' },
  { id: 'subscription-management', label: 'Subscription Management' },
  { id: 'settings', label: 'Settings' },
  { id: 'audit-logs', label: 'Audit Logs' },
];

const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export', 'assign', 'manage', 'suspend', 'activate'];

export default function RolesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(mockRoles);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showPermMatrix, setShowPermMatrix] = useState(null);

  const handleDelete = (id) => {
    setData((prev) => prev.filter((r) => r.id !== id));
    setConfirmDelete(null);
    toast.success('Role deleted');
  };

  const duplicate = (role) => {
    const newRole = { ...role, id: `role-${Date.now()}`, name: `${role.name} (Copy)`, code: `${role.code}_COPY`, userCount: 0, isProtected: false };
    setData((prev) => [...prev, newRole]);
    toast.success('Role duplicated');
  };

  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: 'Roles & Permissions' }]} />
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-solar-navy">Roles & Permissions</h1>
          <p className="text-solar-slate text-sm mt-0.5">{data.length} roles configured</p>
        </div>
        <button onClick={() => navigate('/roles/create')} className="btn-primary">
          <Plus size={16} /> Create Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1 space-y-3">
          {data.map((role) => (
            <div key={role.id}
              onClick={() => setSelectedRole(role)}
              className={`card p-4 cursor-pointer transition-all duration-150 card-hover
                ${selectedRole?.id === role.id ? 'border-primary ring-1 ring-primary' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-solar-navy">{role.name}</span>
                    {role.isProtected && <span className="badge-warning text-xs">Protected</span>}
                  </div>
                  <div className="text-xs text-solar-slate mt-0.5">{role.code}</div>
                </div>
                <StatusBadge status={role.status} />
              </div>
              <p className="text-xs text-solar-slate mb-3 line-clamp-2">{role.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-solar-slate">
                  <Users size={12} /> {role.userCount} users
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/roles/${role.id}`); }}
                    className="btn-icon btn-ghost btn-sm" title="View"><Eye size={13} /></button>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/roles/${role.id}/edit`); }}
                    className="btn-icon btn-ghost btn-sm" title="Edit"><Edit2 size={13} /></button>
                  <button onClick={(e) => { e.stopPropagation(); duplicate(role); }}
                    className="btn-icon btn-ghost btn-sm" title="Duplicate"><Copy size={13} /></button>
                  {!role.isProtected && (
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(role.id); }}
                      className="btn-icon btn-ghost btn-sm" title="Delete"><Trash2 size={13} className="text-red-500" /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Permission Matrix */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-solar-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-solar-navy">{selectedRole.name} — Permission Matrix</h3>
                  <p className="text-xs text-solar-slate mt-0.5">{selectedRole.description}</p>
                </div>
                <RoleBadge role={selectedRole.name} code={selectedRole.code} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2.5 text-left font-semibold text-solar-slate border-b border-solar-border">Module</th>
                      {ACTIONS.map((a) => (
                        <th key={a} className="px-2 py-2.5 text-center font-semibold text-solar-slate border-b border-solar-border capitalize">{a}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map((mod) => {
                      const perms = selectedRole.permissions[mod.id] || [];
                      return (
                        <tr key={mod.id} className="hover:bg-gray-50 border-b border-gray-50">
                          <td className="px-4 py-2.5 font-medium text-solar-navy">{mod.label}</td>
                          {ACTIONS.map((a) => (
                            <td key={a} className="px-2 py-2.5 text-center">
                              {perms.includes(a) ? (
                                <span className="w-4 h-4 bg-accent rounded-sm flex items-center justify-center mx-auto">
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </span>
                              ) : (
                                <span className="w-4 h-4 bg-gray-100 rounded-sm flex items-center justify-center mx-auto">
                                  <span className="w-1.5 h-0.5 bg-gray-300 rounded" />
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center h-full flex flex-col items-center justify-center">
              <Shield size={40} className="text-gray-300 mb-3" />
              <h3 className="text-lg font-semibold text-solar-navy mb-1">Select a Role</h3>
              <p className="text-solar-slate text-sm">Click on a role to view its permission matrix</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Role"
        message="Are you sure you want to delete this role? Users assigned to this role will lose their access."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
