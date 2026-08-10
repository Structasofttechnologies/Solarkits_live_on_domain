import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Key, UserX, UserCheck, Trash2, Shield, Globe, Package, Activity, FileText, Lock } from 'lucide-react';
import { users as mockUsers } from '../../mocks/users';
import { StatusBadge, RoleBadge, Avatar } from '../../components/common/Badges';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Access & Permissions', 'Products', 'Login Activity', 'Audit History', 'Security', 'Notes'];

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = mockUsers.find((u) => u.id === id) || mockUsers[0];
  const [tab, setTab] = useState('Overview');
  const [confirmAction, setConfirmAction] = useState(null);

  const loginActivity = [
    { time: '2026-07-14 09:12', ip: '103.21.45.12', device: 'Chrome / Windows', location: 'Mumbai, India', status: 'success' },
    { time: '2026-07-13 14:30', ip: '103.21.45.12', device: 'Chrome / Windows', location: 'Mumbai, India', status: 'success' },
    { time: '2026-07-12 08:00', ip: '192.168.1.100', device: 'Safari / macOS', location: 'Mumbai, India', status: 'success' },
    { time: '2026-07-10 20:15', ip: '45.67.89.12', device: 'Unknown', location: 'Unknown', status: 'warning' },
  ];

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: 'EPC Users', path: '/users' }, { label: user.name }]} />

      {/* Header */}
      <div className="card p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/users')} className="btn-ghost btn-sm"><ArrowLeft size={16} /></button>
            <Avatar name={user.name} size="lg" />
            <div>
              <h1 className="text-xl font-bold text-solar-navy">{user.name}</h1>
              <div className="text-sm text-solar-slate">{user.employeeId} · {user.email}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <RoleBadge role={user.role} code={user.roleCode} />
                <StatusBadge status={user.status} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => navigate(`/users/${user.id}/edit`)} className="btn-outline btn-sm"><Edit2 size={14} /> Edit</button>
            <button className="btn-outline btn-sm text-blue-600 border-blue-200 hover:bg-blue-50"><Key size={14} /> Reset Password</button>
            {user.status === 'active' ? (
              <button onClick={() => setConfirmAction('suspend')} className="btn-outline btn-sm text-amber-600 border-amber-200 hover:bg-amber-50"><UserX size={14} /> Suspend</button>
            ) : (
              <button onClick={() => { toast.success('User activated'); }} className="btn-success btn-sm"><UserCheck size={14} /> Activate</button>
            )}
            <button onClick={() => setConfirmAction('delete')} className="btn-danger btn-sm"><Trash2 size={14} /> Delete</button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Company', value: user.company, icon: '🏢' },
          { label: 'Country', value: user.country, icon: '🌍' },
          { label: 'Products', value: user.products.length + ' assigned', icon: '📦' },
          { label: 'Last Login', value: user.lastLogin, icon: '⏰' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="font-semibold text-solar-navy text-sm">{s.value}</div>
            <div className="text-xs text-solar-slate">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-solar-border mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${tab === t ? 'border-primary text-primary' : 'border-transparent text-solar-slate hover:text-solar-navy'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-solar-navy mb-4">Personal Details</h3>
            {[
              ['Full Name', user.name], ['Employee ID', user.employeeId],
              ['Email', user.email], ['Phone', user.phone],
              ['Country', user.country], ['State', user.state], ['District', user.district],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-gray-50 py-2">
                <span className="text-solar-slate">{k}</span>
                <span className="font-medium text-solar-navy">{v}</span>
              </div>
            ))}
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-solar-navy mb-4">Account Information</h3>
            {[
              ['Role', user.role], ['Company', user.company],
              ['Plan', user.plan], ['Status', user.status],
              ['Created', user.createdAt], ['Last Login', user.lastLogin],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-gray-50 py-2">
                <span className="text-solar-slate">{k}</span>
                <span className="font-medium text-solar-navy capitalize">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Products' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {user.products.map((p) => (
            <div key={p} className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-accent-50 text-accent rounded-lg flex items-center justify-center"><Package size={18} /></div>
              <div>
                <div className="font-medium text-solar-navy">{p}</div>
                <div className="text-xs text-solar-slate">Full Access</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Login Activity' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-solar-border font-semibold text-solar-navy">Login History</div>
          <table className="data-table w-full">
            <thead><tr><th>Time</th><th>IP Address</th><th>Device</th><th>Location</th><th>Result</th></tr></thead>
            <tbody>
              {loginActivity.map((a, i) => (
                <tr key={i}>
                  <td className="text-sm">{a.time}</td>
                  <td className="text-sm font-mono">{a.ip}</td>
                  <td className="text-sm">{a.device}</td>
                  <td className="text-sm">{a.location}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(tab === 'Access & Permissions' || tab === 'Audit History' || tab === 'Security' || tab === 'Notes') && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-solar-navy mb-2">{tab}</h3>
          <p className="text-solar-slate text-sm">Ready for backend integration.</p>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction === 'delete' ? 'Delete User' : 'Suspend User'}
        message={`Are you sure you want to ${confirmAction} ${user.name}?`}
        confirmLabel={confirmAction === 'delete' ? 'Delete' : 'Suspend'}
        variant="danger"
        onConfirm={() => { toast.success(`User ${confirmAction}d`); setConfirmAction(null); navigate('/users'); }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
