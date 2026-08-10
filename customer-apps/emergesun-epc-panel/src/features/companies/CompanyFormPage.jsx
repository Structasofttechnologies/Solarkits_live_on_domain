import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Check } from 'lucide-react';
import { companies } from '../../mocks/companies';
import { geoData } from '../../mocks/geoData';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import toast from 'react-hot-toast';

const STEPS = ['Basic Info', 'Location', 'Operations', 'Review'];

export default function CompanyFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const existing = isEdit ? companies.find((c) => c.id === id) : null;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: existing?.name || '',
    legalName: existing?.legalName || '',
    code: existing?.code || '',
    registrationNumber: existing?.registrationNumber || '',
    taxId: existing?.taxId || '',
    email: existing?.email || '',
    phone: existing?.phone || '',
    website: existing?.website || '',
    hqCountry: existing?.hqCountry || '',
    hqState: existing?.hqState || '',
    hqCity: existing?.hqCity || '',
    address: existing?.address || '',
    postalCode: existing?.postalCode || '',
    operatingCountries: existing?.operatingCountries || [],
    subscriptionPlan: existing?.subscriptionPlan || 'Starter',
    status: existing?.status || 'active',
  });

  const countryOptions = Object.keys(geoData);
  const stateOptions = form.hqCountry ? Object.keys(geoData[form.hqCountry]?.states || {}) : [];

  const updateField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleCountry = (c) => {
    setForm((f) => ({
      ...f,
      operatingCountries: f.operatingCountries.includes(c)
        ? f.operatingCountries.filter((x) => x !== c)
        : [...f.operatingCountries, c],
    }));
  };

  const handleSubmit = () => {
    toast.success(`Company ${isEdit ? 'updated' : 'created'} successfully!`);
    navigate('/companies');
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <Breadcrumbs items={[{ label: 'Company Management', path: '/companies' }, { label: isEdit ? 'Edit Company' : 'Create Company' }]} />
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/companies')} className="btn-ghost btn-sm"><ArrowLeft size={16} /></button>
        <h1 className="text-2xl font-bold text-solar-navy">{isEdit ? 'Edit Company' : 'Create New Company'}</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 cursor-pointer`} onClick={() => i < step && setStep(i)}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${i < step ? 'bg-accent text-white' : i === step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`hidden sm:block text-sm font-medium ${i === step ? 'text-primary' : i < step ? 'text-accent' : 'text-solar-slate'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-accent' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="card p-6">
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="section-title">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Company Name *</label><input className="input" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="e.g. SunTech Energy Solutions" /></div>
              <div><label className="label">Legal Name *</label><input className="input" value={form.legalName} onChange={(e) => updateField('legalName', e.target.value)} placeholder="Full legal name" /></div>
              <div><label className="label">Company Code *</label><input className="input" value={form.code} onChange={(e) => updateField('code', e.target.value)} placeholder="e.g. STE" /></div>
              <div><label className="label">Registration Number</label><input className="input" value={form.registrationNumber} onChange={(e) => updateField('registrationNumber', e.target.value)} /></div>
              <div><label className="label">Tax ID / GST</label><input className="input" value={form.taxId} onChange={(e) => updateField('taxId', e.target.value)} /></div>
              <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} /></div>
              <div><label className="label">Website</label><input className="input" value={form.website} onChange={(e) => updateField('website', e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="section-title">Headquarters Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Headquarters Country *</label>
                <select className="select" value={form.hqCountry} onChange={(e) => updateField('hqCountry', e.target.value)}>
                  <option value="">Select Country</option>
                  {countryOptions.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">State / Province</label>
                <select className="select" value={form.hqState} onChange={(e) => updateField('hqState', e.target.value)}>
                  <option value="">Select State</option>
                  {stateOptions.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="label">City</label><input className="input" value={form.hqCity} onChange={(e) => updateField('hqCity', e.target.value)} /></div>
              <div><label className="label">Postal Code</label><input className="input" value={form.postalCode} onChange={(e) => updateField('postalCode', e.target.value)} /></div>
              <div className="md:col-span-2"><label className="label">Address</label><textarea className="input h-20 resize-none" value={form.address} onChange={(e) => updateField('address', e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* Step 2: Operations */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="section-title">Operations & Plan</h2>
            <div>
              <label className="label mb-2">Operating Countries</label>
              <div className="flex flex-wrap gap-2">
                {countryOptions.map((c) => (
                  <button key={c} type="button" onClick={() => toggleCountry(c)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors font-medium
                      ${form.operatingCountries.includes(c) ? 'bg-primary text-white border-primary' : 'bg-white text-solar-slate border-solar-border hover:border-primary hover:text-primary'}`}>
                    {geoData[c]?.flag} {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="label">Subscription Plan</label>
                <select className="select" value={form.subscriptionPlan} onChange={(e) => updateField('subscriptionPlan', e.target.value)}>
                  <option>Starter</option>
                  <option>Professional</option>
                  <option>Enterprise</option>
                  <option>Custom</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="select" value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="section-title">Review & Confirm</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                ['Company Name', form.name],
                ['Legal Name', form.legalName],
                ['Code', form.code],
                ['Email', form.email],
                ['Phone', form.phone],
                ['Country', form.hqCountry],
                ['State', form.hqState],
                ['City', form.hqCity],
                ['Plan', form.subscriptionPlan],
                ['Status', form.status],
                ['Operating Countries', form.operatingCountries.join(', ') || 'None selected'],
              ].map(([k, v]) => (
                <div key={k} className="text-sm border-b border-gray-100 pb-2 flex justify-between">
                  <span className="text-solar-slate">{k}</span>
                  <span className="font-medium text-solar-navy text-right">{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-solar-border">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/companies')} className="btn-outline">
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="btn-primary">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-primary">
              {isEdit ? 'Update Company' : 'Create Company'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
