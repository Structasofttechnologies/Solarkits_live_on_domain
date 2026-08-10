import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Check, Upload } from 'lucide-react';
import { users as mockUsers } from '../../mocks/users';
import { geoData } from '../../mocks/geoData';
import { roles } from '../../mocks/roles';
import { companies } from '../../mocks/companies';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import toast from 'react-hot-toast';

const STEPS = ['Personal Info', 'Company & Location', 'Role & Access', 'Account Settings', 'Review'];

const PRODUCTS = ['Residential Solar', 'Commercial Solar', 'Solar E-Shop', 'Procurement', 'CRM', 'Order Management', 'Service & Support', 'Reports & Analytics'];

export default function UserFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id && id !== 'create';
  const existing = isEdit ? mockUsers.find((u) => u.id === id) : null;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: existing?.name || '',
    employeeId: existing?.employeeId || '',
    email: existing?.email || '',
    phone: existing?.phone || '',
    altPhone: '',
    language: 'English',
    companyId: existing?.companyId || '',
    country: existing?.country || '',
    state: existing?.state || '',
    district: existing?.district || '',
    city: '',
    address: '',
    roleCode: existing?.roleCode || '',
    department: '',
    manager: '',
    products: existing?.products || [],
    status: existing?.status || 'active',
    forcePwChange: true,
    loginAllowed: true,
    twoFactor: false,
    sendWelcomeEmail: true,
    accountExpiry: '',
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const countryOptions = Object.keys(geoData);
  const stateOptions = form.country ? Object.keys(geoData[form.country]?.states || {}) : [];
  const districtOptions = (form.country && form.state) ? geoData[form.country]?.states[form.state]?.districts || [] : [];

  const toggleProduct = (p) => setForm((f) => ({
    ...f,
    products: f.products.includes(p) ? f.products.filter((x) => x !== p) : [...f.products, p],
  }));

  const handleSubmit = () => {
    toast.success(`User ${isEdit ? 'updated' : 'created'} successfully!`);
    navigate('/users');
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <Breadcrumbs items={[{ label: 'EPC Users', path: '/users' }, { label: isEdit ? 'Edit User' : 'Create User' }]} />
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/users')} className="btn-ghost btn-sm"><ArrowLeft size={16} /></button>
        <h1 className="text-2xl font-bold text-solar-navy">{isEdit ? 'Edit User' : 'Create New User'}</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => i < step && setStep(i)}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${i < step ? 'bg-accent text-white' : i === step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <span className={`hidden sm:block text-xs font-medium whitespace-nowrap ${i === step ? 'text-primary' : i < step ? 'text-accent' : 'text-solar-slate'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 min-w-[20px] ${i < step ? 'bg-accent' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="card p-6">
        {step === 0 && (
          <div>
            <h2 className="section-title">Personal Information</h2>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-300">
                <Upload size={20} className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-400">Photo</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={(e) => upd('name', e.target.value)} placeholder="e.g. John Smith" /></div>
              <div><label className="label">Employee ID *</label><input className="input" value={form.employeeId} onChange={(e) => upd('employeeId', e.target.value)} placeholder="e.g. EMP-001" /></div>
              <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={(e) => upd('email', e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => upd('phone', e.target.value)} /></div>
              <div><label className="label">Alternate Phone</label><input className="input" value={form.altPhone} onChange={(e) => upd('altPhone', e.target.value)} /></div>
              <div><label className="label">Preferred Language</label>
                <select className="select" value={form.language} onChange={(e) => upd('language', e.target.value)}>
                  <option>English</option><option>Arabic</option><option>German</option><option>Hindi</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="section-title">Company & Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Company *</label>
                <select className="select" value={form.companyId} onChange={(e) => upd('companyId', e.target.value)}>
                  <option value="">Select Company</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="label">Country *</label>
                <select className="select" value={form.country} onChange={(e) => { upd('country', e.target.value); upd('state', ''); upd('district', ''); }}>
                  <option value="">Select Country</option>
                  {countryOptions.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">State</label>
                <select className="select" value={form.state} onChange={(e) => { upd('state', e.target.value); upd('district', ''); }}>
                  <option value="">Select State</option>
                  {stateOptions.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="label">District</label>
                <select className="select" value={form.district} onChange={(e) => upd('district', e.target.value)}>
                  <option value="">Select District</option>
                  {districtOptions.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="label">City</label><input className="input" value={form.city} onChange={(e) => upd('city', e.target.value)} /></div>
              <div><label className="label">Address</label><input className="input" value={form.address} onChange={(e) => upd('address', e.target.value)} /></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="section-title">Role & Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div><label className="label">Role *</label>
                <select className="select" value={form.roleCode} onChange={(e) => upd('roleCode', e.target.value)}>
                  <option value="">Select Role</option>
                  {roles.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                </select>
              </div>
              <div><label className="label">Department</label><input className="input" value={form.department} onChange={(e) => upd('department', e.target.value)} placeholder="e.g. Sales" /></div>
              <div><label className="label">Reporting Manager</label>
                <select className="select" value={form.manager} onChange={(e) => upd('manager', e.target.value)}>
                  <option value="">Select Manager</option>
                  <option>Arjun Mehta</option><option>Priya Sharma</option><option>James Carter</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label mb-2">Product Access</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRODUCTS.map((p) => (
                  <button key={p} type="button" onClick={() => toggleProduct(p)}
                    className={`px-3 py-2 rounded-lg text-xs border font-medium transition-colors text-left
                      ${form.products.includes(p) ? 'bg-primary text-white border-primary' : 'bg-white text-solar-slate border-solar-border hover:border-primary hover:text-primary'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="section-title">Account Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Account Status</label>
                <select className="select" value={form.status} onChange={(e) => upd('status', e.target.value)}>
                  <option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
                </select>
              </div>
              <div><label className="label">Account Expiry Date</label>
                <input className="input" type="date" value={form.accountExpiry} onChange={(e) => upd('accountExpiry', e.target.value)} />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ['forcePwChange', 'Force password change on first login'],
                ['loginAllowed', 'Allow login'],
                ['twoFactor', 'Enable two-factor authentication'],
                ['sendWelcomeEmail', 'Send welcome email with credentials'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <span className="text-sm font-medium text-solar-navy">{label}</span>
                  <div onClick={() => upd(key, !form[key])}
                    className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${form[key] ? 'bg-primary' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form[key] ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="section-title">Review & Submit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ['Full Name', form.name], ['Employee ID', form.employeeId], ['Email', form.email],
                ['Phone', form.phone], ['Company', companies.find((c) => c.id === form.companyId)?.name || '—'],
                ['Country', form.country], ['State', form.state], ['District', form.district],
                ['Role', roles.find((r) => r.code === form.roleCode)?.name || '—'],
                ['Status', form.status], ['Products', form.products.join(', ') || 'None'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                  <span className="text-solar-slate">{k}</span>
                  <span className="font-medium text-solar-navy text-right">{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-solar-border">
          <div className="flex items-center gap-2">
            <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/users')} className="btn-outline">
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step === 4 && <button className="btn-ghost btn-sm">Save as Draft</button>}
          </div>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="btn-primary">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-primary">
              {isEdit ? 'Update User' : 'Create User'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
