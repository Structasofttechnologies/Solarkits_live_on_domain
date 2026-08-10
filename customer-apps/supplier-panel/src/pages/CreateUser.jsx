import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import { FaUserPlus, FaShieldAlt, FaEnvelope, FaUserAlt, FaBuilding, FaArrowRight } from "react-icons/fa";
import Button from "../components/Button";
import CustomInput from "../components/CustomInput";
import DropdownWithSearchInput from "../components/DropdownWithSearchInput";

export default function CreateUser() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'operations',
    department: 'logistics',
  });

  const roles = [
    { value: 'admin', text: 'Administrator' },
    { value: 'operations', text: 'Operations Manager' },
    { value: 'sales', text: 'Sales Associate' },
    { value: 'support', text: 'Customer Support' },
  ];

  const departments = [
    { value: 'logistics', text: 'Logistics & Warehousing' },
    { value: 'sales', text: 'Sales & Marketing' },
    { value: 'finance', text: 'Accounts & Finance' },
    { value: 'tech', text: 'Technical Support' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Provision New User" 
        subtitle="Invite team members and assign granular permissions to manage your solar ecosystem." 
        icon={FaUserPlus}
        actions={
          <Button variant="primary" className="rounded-2xl h-12 px-12 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20" rightIcon={<FaArrowRight />}>
            Create & Invite User
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="lg:col-span-2 card p-10 bg-surface border-border space-y-8">
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl">
              <FaUserAlt />
            </div>
            <div>
              <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">Identity Details</h3>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Provide the professional credentials for the new user.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CustomInput 
              label="Full Name"
              placeholder="e.g. Sameer Verma"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              icon={<FaUserAlt />}
            />
            <CustomInput 
              label="Professional Email"
              placeholder="sameer@company.com"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              icon={<FaEnvelope />}
            />
            
            <DropdownWithSearchInput 
              label="Organizational Role"
              options={roles}
              value={formData.role}
              onChange={(val) => setFormData({...formData, role: val})}
              className="w-full"
            />

            <DropdownWithSearchInput 
              label="Primary Department"
              options={departments}
              value={formData.department}
              onChange={(val) => setFormData({...formData, department: val})}
              className="w-full"
            />
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row gap-4 items-center">
            <div className="max-w-xs">
              <CustomInput 
                type="checkbox"
                customCheckbox={true}
                options={[{ value: 'invite', label: 'Send invitation email immediately' }]}
                value="invite"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>

        {/* Permissions Preview Sidebar */}
        <div className="space-y-6">
          <div className="card p-8 bg-surface border-border space-y-6">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight flex items-center gap-3">
              <FaShieldAlt className="text-primary text-sm" />
              Role Permissions
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Inventory Management', status: 'Allowed' },
                { label: 'Bulk Data Ingestion', status: 'Allowed' },
                { label: 'Financial Analytics', status: 'Restricted' },
                { label: 'API Key Management', status: 'Locked' },
              ].map((perm, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-surface-hover/50 border border-border">
                  <span className="text-[10px] font-black text-text-primary uppercase tracking-tight">{perm.label}</span>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                    perm.status === 'Allowed' ? 'bg-success/10 text-success' : 
                    perm.status === 'Restricted' ? 'bg-warning/10 text-warning' : 
                    'bg-danger/10 text-danger'
                  }`}>
                    {perm.status}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold text-text-muted uppercase text-center pt-2">
              Permissions are inherited from the <span className="text-primary font-black">Role</span> selection.
            </p>
          </div>

          <div className="card p-8 bg-linear-120 from-primary/5 to-primary/10 border-primary/20 flex flex-col items-center text-center space-y-4">
            <FaBuilding className="text-primary text-3xl" />
            <div>
              <h4 className="text-sm font-black text-text-primary uppercase tracking-tight">Enterprise Seats</h4>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">4 of 10 Seats occupied</p>
            </div>
            <div className="w-full h-2 bg-surface border border-border rounded-full overflow-hidden">
              <div className="w-[40%] h-full gradient-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
