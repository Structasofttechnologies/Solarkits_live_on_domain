import React from "react";
import PageHeader from "../components/PageHeader";
import { FaUsersCog, FaUserPlus, FaShieldAlt, FaEllipsisV, FaCheckCircle, FaUserCircle, FaClock } from "react-icons/fa";
import Button from "../components/Button";
import { motion } from "framer-motion";

export default function TeamAccess() {
  const teamMembers = [
    { name: 'Aditya Birla', role: 'Owner / Admin', email: 'aditya@enterprise.com', status: 'Active', lastActive: 'Online Now' },
    { name: 'Sameer Verma', role: 'Inventory Manager', email: 'sameer@enterprise.com', status: 'Active', lastActive: '2h ago' },
    { name: 'Priya Sharma', role: 'Sales & Billing', email: 'priya@enterprise.com', status: 'Inactive', lastActive: '5 days ago' },
    { name: 'Rahul Gupta', role: 'Developer', email: 'rahul@enterprise.com', status: 'Active', lastActive: '10m ago' },
  ];

  const roles = [
    { title: 'Administrator', desc: 'Full access to all modules and billing.' },
    { title: 'Operations', desc: 'Manage inventory, bulk uploads, and stock.' },
    { title: 'Support', desc: 'View orders and respond to support tickets.' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Team & Access Governance" 
        subtitle="Manage organizational roles, permissions, and team member access levels." 
        icon={FaUsersCog}
        actions={
          <Button 
            variant="primary" 
            className="rounded-xl font-bold text-xs uppercase tracking-widest h-12 shadow-lg shadow-primary/20 px-8"
            leftIcon={<FaUserPlus />}
          >
            Invite Member
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Team List */}
        <div className="lg:col-span-2 card bg-surface border-border overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Active Members</h3>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              4 of 10 Seats Used
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-hover/50 text-[10px] font-black text-text-muted uppercase tracking-widest">
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">Role / Permissions</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Activity</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {teamMembers.map((member, idx) => (
                  <tr key={idx} className="hover:bg-surface-hover/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                          <FaUserCircle className="text-2xl" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-text-primary group-hover:text-primary transition-colors">{member.name}</p>
                          <p className="text-[10px] font-bold text-text-muted truncate max-w-[150px]">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-text-secondary uppercase tracking-tight">{member.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${member.status === 'Active' ? 'bg-success' : 'bg-warning'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${member.status === 'Active' ? 'text-success' : 'text-warning'}`}>
                          {member.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-text-muted">
                        <FaClock className="text-xs" />
                        <span className="text-xs font-bold">{member.lastActive}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-muted">
                        <FaEllipsisV />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Roles & Permissions */}
        <div className="space-y-6">
          <div className="card p-8 bg-surface border-border">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight mb-6">Role Definitions</h3>
            <div className="space-y-6">
              {roles.map((role, idx) => (
                <div key={idx} className="space-y-2 group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FaShieldAlt className="text-primary text-xs" />
                    <h4 className="text-sm font-black text-text-primary uppercase tracking-tight group-hover:text-primary transition-colors">{role.title}</h4>
                  </div>
                  <p className="text-xs font-semibold text-text-secondary leading-relaxed pl-6">
                    {role.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border-2 border-primary/20 rounded-[2.5rem] p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl mx-auto shadow-inner">
              <FaShieldAlt />
            </div>
            <div>
              <h4 className="text-lg font-black text-text-primary uppercase tracking-tight">Security Protocol</h4>
              <p className="text-[10px] font-bold text-text-secondary mt-2 leading-relaxed">
                2FA is enforced for all Administrative roles. Multi-factor authentication ensures your organizational data remains secure.
              </p>
            </div>
            <Button variant="outline-primary" fullWidth className="rounded-xl h-11 font-black uppercase tracking-widest text-[10px]">
              Security Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
