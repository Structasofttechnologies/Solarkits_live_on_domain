// src/pages/team/TeamPage.jsx
import { useState } from 'react';
import { Shield, Plus, Mail, Phone, Lock, Edit, Trash2, CheckCircle2, Globe } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { ROLES, ROLE_LABELS, ALL_COUNTRIES } from '../../constants';
import { toast } from '../../hooks';
import { getInitials } from '../../utils/formatters';

const initialMembers = [
  { id: '1', name: 'Rajesh Kumar', email: 'rajesh@emergesun.com', phone: '+91 98765 43210', role: ROLES.EPC_OWNER, branch: 'Rajkot HQ', country: 'India', status: 'active' },
  { id: '2', name: 'Priya Mehta', email: 'priya.mehta@emergesun.com', phone: '+91 98765 43211', role: ROLES.AMC_MANAGER, branch: 'Rajkot HQ', country: 'India', status: 'active' },
  { id: '3', name: 'Vikram Singh', email: 'vikram.s@emergesun.com', phone: '+91 98765 43212', role: ROLES.SERVICE_MANAGER, branch: 'Ahmedabad Branch', country: 'India', status: 'active' },
  { id: '4', name: 'Suresh Patel', email: 'suresh.p@emergesun.com', phone: '+91 98765 43213', role: ROLES.TECHNICIAN, branch: 'Rajkot HQ', country: 'India', status: 'active' },
  { id: '5', name: 'Amit Sharma', email: 'amit.s@emergesun.com', phone: '+91 98765 43214', role: ROLES.TECHNICIAN, branch: 'Surat Branch', country: 'India', status: 'active' },
  { id: '6', name: 'Neha Joshi', email: 'neha.j@emergesun.com', phone: '+91 98765 43215', role: ROLES.FINANCE_USER, branch: 'Rajkot HQ', country: 'India', status: 'active' },
];

export default function TeamPage() {
  const [members, setMembers] = useState(initialMembers);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: ROLES.TECHNICIAN,
    branch: 'Rajkot HQ',
    country: 'India'
  });

  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.name) {
      toast.error('Name and email are required');
      return;
    }
    const newMember = {
      id: String(Date.now()),
      ...inviteForm,
      status: 'active',
    };
    setMembers([newMember, ...members]);
    setShowInviteModal(false);
    toast.success(`Invitation sent to ${inviteForm.email}!`);
    setInviteForm({ name: '', email: '', phone: '', role: ROLES.TECHNICIAN, branch: 'Rajkot HQ', country: 'India' });
  };

  const removeMember = (id) => {
    setMembers(members.filter(m => m.id !== id));
    toast.info('Team member removed');
  };

  return (
    <div className="page-container max-w-6xl">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield size={22} className="text-solar" />
            Team Members & Role-Based Access
          </h1>
          <p className="page-subtitle">Manage user permissions, roles, country regions, and branch access across your organization</p>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowInviteModal(true)}>
          Invite Team Member
        </Button>
      </div>

      {/* Role Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(ROLE_LABELS).map(([roleKey, label]) => {
          const count = members.filter(m => m.role === roleKey).length;
          return (
            <div key={roleKey} className="card p-4 border border-border">
              <p className="text-xs text-text-muted font-mono uppercase">{roleKey}</p>
              <p className="text-lg font-bold text-navy mt-1 truncate">{label}</p>
              <p className="text-sm font-semibold text-solar mt-2">{count} member{count !== 1 ? 's' : ''}</p>
            </div>
          );
        })}
      </div>

      {/* Team Table */}
      <div className="card overflow-hidden">
        <div className="card-header px-5 py-4 border-b border-border">
          <h3 className="card-title">All Team Members ({members.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                {['Member', 'Role', 'Country / Branch', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map(member => (
                <tr key={member.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-navy text-sm leading-snug">{member.name}</p>
                        <p className="text-xs text-text-secondary">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-semibold px-2 py-1 bg-solar/15 text-navy rounded border border-solar/20">
                      {ROLE_LABELS[member.role] || member.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <Globe size={13} className="text-solar shrink-0" />
                      <span>{member.country || 'India'}</span>
                      <span className="text-text-muted">•</span>
                      <span>{member.branch}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><Badge status={member.status} dot size="xs" /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button className="text-xs text-solar hover:underline" onClick={() => toast.info('Edit member settings...')}>Edit</button>
                      {member.role !== ROLES.EPC_OWNER && (
                        <button className="text-xs text-danger hover:underline" onClick={() => removeMember(member.id)}>Remove</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button onClick={handleInvite}>Send Invitation</Button>
          </>
        }
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input
              required
              value={inviteForm.name}
              onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
              className="form-input"
              placeholder="e.g. Ramesh Patel"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Work Email *</label>
              <input
                required
                type="email"
                value={inviteForm.email}
                onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                className="form-input"
                placeholder="ramesh@company.com"
              />
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input
                value={inviteForm.phone}
                onChange={e => setInviteForm({ ...inviteForm, phone: e.target.value })}
                className="form-input"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Country</label>
              <select
                value={inviteForm.country}
                onChange={e => setInviteForm({ ...inviteForm, country: e.target.value })}
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
              <label className="form-label">Assigned Role</label>
              <select
                value={inviteForm.role}
                onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                className="form-select"
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Assigned Branch</label>
              <select
                value={inviteForm.branch}
                onChange={e => setInviteForm({ ...inviteForm, branch: e.target.value })}
                className="form-select"
              >
                <option>Rajkot HQ</option>
                <option>Ahmedabad Branch</option>
                <option>Surat Branch</option>
                <option>Mumbai Branch</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
