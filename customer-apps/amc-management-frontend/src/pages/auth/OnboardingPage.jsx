// src/pages/auth/OnboardingPage.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, CheckCircle2, ArrowRight, ArrowLeft, Upload, Plus, X } from 'lucide-react';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { toast } from '../../hooks';
import { ALL_COUNTRIES, getCountryByName } from '../../constants';

const STEPS = [
  { id: 1, title: 'Company Information', desc: 'Tell us about your EPC business' },
  { id: 2, title: 'Business Operations', desc: 'What type of solar projects do you handle?' },
  { id: 3, title: 'AMC Services', desc: 'Which AMC services do you offer?' },
  { id: 4, title: 'Configure First AMC Plan', desc: 'Set up your first AMC plan' },
  { id: 5, title: 'Invite Team', desc: 'Add your team members (optional)' },
  { id: 6, title: 'Import Data', desc: 'Upload existing customers and sites (optional)' },
  { id: 7, title: 'All Set!', desc: 'Your workspace is ready' },
];

function DragAndDropBox({
  accept = "image/*",
  title = "Click to upload or drag & drop",
  subtitle = "PNG, JPG, SVG up to 2MB",
  file,
  filePreview,
  onFileSelect,
  onRemove,
  isImage = true,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept={accept}
        className="hidden"
      />
      {file ? (
        <div className="relative flex items-center gap-3 p-3 bg-gray-50 border-2 border-solar/40 rounded-xl">
          {isImage && filePreview ? (
            <img
              src={filePreview}
              alt="Uploaded Preview"
              className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-solar/10 flex items-center justify-center text-solar shrink-0 font-bold text-xs">
              📄
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-navy truncate">{file.name}</p>
            <p className="text-[11px] text-text-secondary">
              {(file.size / 1024).toFixed(1)} KB • <span className="text-emerald-600 font-semibold">Uploaded</span>
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onRemove) onRemove();
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="p-1.5 rounded-lg hover:bg-danger-50 text-danger transition-colors"
            title="Remove File"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-solar bg-solar/10 scale-[1.01] shadow-md"
              : "border-border hover:border-solar/50 hover:bg-solar/5"
          }`}
        >
          <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center transition-colors ${isDragging ? "bg-solar text-white" : "bg-gray-100 text-text-muted"}`}>
            <Upload size={20} />
          </div>
          <p className="text-xs font-semibold text-navy mb-0.5">{isDragging ? "Drop your file here" : title}</p>
          <p className="text-[11px] text-text-secondary">{subtitle}</p>
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { completeOnboarding } = useUIStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [company, setCompany] = useState({
    name: user?.company?.name || user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: 'India',
    state: '',
    city: '',
    gst: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Step 2
  const [operations, setOperations] = useState({
    types: ['commercial', 'industrial'],
    installations: '500+',
    amcCustomers: '100-500',
    branches: '3-5',
    technicians: '10-25',
  });

  // Step 3
  const [services, setServices] = useState({
    preventiveMaintenance: true,
    panelCleaning: true,
    correctiveMaintenance: true,
    powerWarranty: false,
    remoteMonitoring: true,
  });

  // Step 4
  const [plan, setPlan] = useState({
    name: 'Cleaning + Maintenance AMC',
    visitFrequency: '4',
    cleaningFrequency: '6',
    duration: '1 year',
    basePrice: '32000',
    capacityMin: '25',
    capacityMax: '2000',
  });

  // Step 5
  const [invites, setInvites] = useState([
    { name: '', email: '', role: 'technician', branch: 'HQ' },
  ]);

  // Step 6
  const [customerImportFile, setCustomerImportFile] = useState(null);
  const [siteImportFile, setSiteImportFile] = useState(null);

  const handleLogoSelect = (selectedFile) => {
    setLogoFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  const toggleService = (key) => {
    setServices(s => ({ ...s, [key]: !s[key] }));
  };

  const toggleType = (type) => {
    setOperations(o => ({
      ...o,
      types: o.types.includes(type) ? o.types.filter(t => t !== type) : [...o.types, type],
    }));
  };

  const addInvite = () => setInvites(v => [...v, { name: '', email: '', role: 'technician', branch: 'HQ' }]);
  const removeInvite = (i) => setInvites(v => v.filter((_, idx) => idx !== i));

  const handleNext = async () => {
    if (step < 6) {
      setStep(s => s + 1);
    } else {
      setLoading(true);
      await new Promise(r => setTimeout(r, 1200));
      setLoading(false);
      setStep(7);
    }
  };

  const handleFinish = () => {
    completeOnboarding();
    toast.success('Welcome to Emergesun AMC Cloud! Your workspace is ready.');
    navigate('/dashboard');
  };

  const progress = ((step - 1) / 6) * 100;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
            <Sun size={18} className="text-solar" />
          </div>
          <span className="font-bold text-navy">Emergesun AMC Cloud</span>
        </div>
        {step < 7 && (
          <p className="text-sm text-text-secondary">Step {step} of 6</p>
        )}
      </header>

      {/* Progress bar */}
      {step < 7 && (
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-solar transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Step indicators */}
          {step < 7 && (
            <div className="flex items-center justify-center mb-8 overflow-x-auto pb-2">
              {STEPS.slice(0, 6).map((s, i) => (
                <div key={s.id} className="flex items-center">
                  <div className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all',
                    step > s.id ? 'bg-success text-white' : step === s.id ? 'bg-solar text-white' : 'bg-gray-200 text-text-muted',
                  ].join(' ')}>
                    {step > s.id ? <CheckCircle2 size={16} /> : s.id}
                  </div>
                  {i < 5 && <div className={`h-0.5 w-8 mx-1 shrink-0 ${step > s.id ? 'bg-success' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
          )}

          {/* Step content */}
          <div className="bg-white rounded-xl border border-border shadow-card p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-navy">{STEPS[step - 1].title}</h2>
              <p className="text-sm text-text-secondary mt-1">{STEPS[step - 1].desc}</p>
            </div>

            {/* Step 1: Company Info */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">EPC Company Name</label>
                  <input
                    value={company.name}
                    onChange={e => setCompany(c => ({ ...c, name: e.target.value }))}
                    className="form-input"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="form-label">Business Email</label>
                  <input
                    type="email"
                    value={company.email}
                    onChange={e => setCompany(c => ({ ...c, email: e.target.value }))}
                    className="form-input"
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    value={company.phone}
                    onChange={e => setCompany(c => ({ ...c, phone: e.target.value }))}
                    className="form-input"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="form-label">Country</label>
                  <select
                    value={company.country}
                    onChange={e => {
                      const countryName = e.target.value;
                      const cObj = getCountryByName(countryName);
                      setCompany(c => ({
                        ...c,
                        country: countryName,
                        state: cObj.states ? cObj.states[0] : ''
                      }));
                    }}
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
                  <label className="form-label">GST Number / Tax ID</label>
                  <input
                    value={company.gst}
                    onChange={e => setCompany(c => ({ ...c, gst: e.target.value }))}
                    className="form-input"
                    placeholder="24AABCE1234Z1Z5"
                  />
                </div>
                <div>
                  <label className="form-label">State / Province</label>
                  {(() => {
                    const cObj = getCountryByName(company.country);
                    return cObj.states && cObj.states.length > 0 ? (
                      <select
                        value={company.state}
                        onChange={e => setCompany(c => ({ ...c, state: e.target.value }))}
                        className="form-select"
                      >
                        {cObj.states.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input
                        value={company.state}
                        onChange={e => setCompany(c => ({ ...c, state: e.target.value }))}
                        className="form-input"
                        placeholder="State"
                      />
                    );
                  })()}
                </div>
                <div>
                  <label className="form-label">City</label>
                  <input type="text" value={company.city} onChange={e => setCompany(c => ({ ...c, city: e.target.value }))} className="form-input" placeholder="City" />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Company Logo</label>
                  <DragAndDropBox
                    accept="image/*"
                    title="Click to upload or drag & drop company logo"
                    subtitle="PNG, JPG, SVG up to 2MB"
                    file={logoFile}
                    filePreview={logoPreview}
                    onFileSelect={handleLogoSelect}
                    onRemove={() => { setLogoFile(null); setLogoPreview(null); }}
                    isImage={true}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Business Operations */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <p className="form-label mb-3">Types of Solar Projects</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'residential', label: 'Residential', icon: '🏠', desc: '1-10 kW systems' },
                      { value: 'commercial', label: 'Commercial', icon: '🏢', desc: '10-500 kW systems' },
                      { value: 'industrial', label: 'Industrial', icon: '🏭', desc: '500 kW - 5 MW systems' },
                      { value: 'utility', label: 'Utility Scale', icon: '⚡', desc: '5 MW+ systems' },
                    ].map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => toggleType(type.value)}
                        className={[
                          'p-4 rounded-lg border-2 text-left transition-all',
                          operations.types.includes(type.value)
                            ? 'border-solar bg-solar/5'
                            : 'border-border hover:border-navy/30',
                        ].join(' ')}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-lg">{type.icon}</span>
                          {operations.types.includes(type.value) && (
                            <CheckCircle2 size={16} className="text-solar" />
                          )}
                        </div>
                        <p className="font-semibold text-navy text-sm">{type.label}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{type.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Number of Solar Installations', key: 'installations', options: ['1-50', '51-200', '201-500', '500+'] },
                    { label: 'Number of AMC Customers', key: 'amcCustomers', options: ['1-50', '51-100', '100-500', '500+'] },
                    { label: 'Number of Branches', key: 'branches', options: ['1', '2-3', '3-5', '5+'] },
                    { label: 'Number of Technicians', key: 'technicians', options: ['1-5', '5-10', '10-25', '25+'] },
                  ].map(({ label, key, options }) => (
                    <div key={key}>
                      <label className="form-label">{label}</label>
                      <select value={operations[key]} onChange={e => setOperations(o => ({ ...o, [key]: e.target.value }))} className="form-select">
                        {options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: AMC Services */}
            {step === 3 && (
              <div className="space-y-3">
                {[
                  { key: 'preventiveMaintenance', label: 'Preventive Maintenance', desc: 'Scheduled inspections and PM visits' },
                  { key: 'panelCleaning', label: 'Panel Cleaning', desc: 'Regular cleaning for optimal performance' },
                  { key: 'correctiveMaintenance', label: 'Corrective Maintenance', desc: 'Fault diagnosis and repair services' },
                  { key: 'powerWarranty', label: 'Power Generation Warranty', desc: 'Guaranteed minimum generation commitment' },
                  { key: 'remoteMonitoring', label: 'Remote Monitoring', desc: '24/7 plant monitoring and alerts' },
                ].map(svc => (
                  <div
                    key={svc.key}
                    onClick={() => toggleService(svc.key)}
                    className={[
                      'flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all',
                      services[svc.key] ? 'border-solar bg-solar/5' : 'border-border hover:border-navy/20',
                    ].join(' ')}
                  >
                    <div>
                      <p className="font-semibold text-navy text-sm">{svc.label}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{svc.desc}</p>
                    </div>
                    <div className={[
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0',
                      services[svc.key] ? 'bg-solar border-solar' : 'border-border',
                    ].join(' ')}>
                      {services[svc.key] && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4: AMC Plan */}
            {step === 4 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">Plan Name</label>
                  <input value={plan.name} onChange={e => setPlan(p => ({ ...p, name: e.target.value }))} className="form-input" />
                </div>
                {[
                  { label: 'Preventive Visits / Year', key: 'visitFrequency' },
                  { label: 'Cleaning Visits / Year', key: 'cleaningFrequency' },
                  { label: 'Base Price (₹/year)', key: 'basePrice' },
                  { label: 'Contract Duration', key: 'duration' },
                  { label: 'Min Capacity (kWp)', key: 'capacityMin' },
                  { label: 'Max Capacity (kWp)', key: 'capacityMax' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="form-label">{label}</label>
                    <input value={plan[key]} onChange={e => setPlan(p => ({ ...p, [key]: e.target.value }))} className="form-input" />
                  </div>
                ))}
              </div>
            )}

            {/* Step 5: Invite Team */}
            {step === 5 && (
              <div className="space-y-4">
                {invites.map((inv, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border relative">
                    {invites.length > 1 && (
                      <button onClick={() => removeInvite(i)} className="absolute top-3 right-3 p-1 rounded hover:bg-gray-100 text-text-muted">
                        <X size={14} />
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">Name</label>
                        <input className="form-input" placeholder="Team member name" value={inv.name} onChange={e => setInvites(v => v.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                      </div>
                      <div>
                        <label className="form-label">Email</label>
                        <input type="email" className="form-input" placeholder="email@company.com" value={inv.email} onChange={e => setInvites(v => v.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} />
                      </div>
                      <div>
                        <label className="form-label">Role</label>
                        <select className="form-select" value={inv.role} onChange={e => setInvites(v => v.map((x, j) => j === i ? { ...x, role: e.target.value } : x))}>
                          {[['technician', 'Technician'], ['service_manager', 'Service Manager'], ['finance_user', 'Finance User'], ['viewer', 'Viewer']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Branch</label>
                        <select className="form-select">
                          <option>HQ</option>
                          <option>Branch 1</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addInvite} className="flex items-center gap-2 text-sm text-solar font-medium hover:underline">
                  <Plus size={14} /> Add Another Member
                </button>
                <p className="text-xs text-text-muted">Team members will receive email invitations.</p>
              </div>
            )}

            {/* Step 6: Import Data */}
            {step === 6 && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-navy text-sm">Import Customers</p>
                      <p className="text-xs text-text-secondary mt-0.5">Upload customer list with contact details</p>
                    </div>
                    <button className="text-xs text-solar hover:underline font-medium">Download Template</button>
                  </div>
                  <DragAndDropBox
                    accept=".csv, .xlsx, .xls"
                    title="Click to upload or drag & drop Customer CSV/Excel file"
                    subtitle="CSV, XLSX up to 5MB"
                    file={customerImportFile}
                    onFileSelect={setCustomerImportFile}
                    onRemove={() => setCustomerImportFile(null)}
                    isImage={false}
                  />
                </div>

                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-navy text-sm">Import Solar Sites</p>
                      <p className="text-xs text-text-secondary mt-0.5">Upload site details with plant specifications</p>
                    </div>
                    <button className="text-xs text-solar hover:underline font-medium">Download Template</button>
                  </div>
                  <DragAndDropBox
                    accept=".csv, .xlsx, .xls"
                    title="Click to upload or drag & drop Sites CSV/Excel file"
                    subtitle="CSV, XLSX up to 5MB"
                    file={siteImportFile}
                    onFileSelect={setSiteImportFile}
                    onRemove={() => setSiteImportFile(null)}
                    isImage={false}
                  />
                </div>

                <div className="p-3 bg-info-50 border border-info/20 rounded-lg">
                  <p className="text-xs text-info-700">💡 You can skip this step and import data later from Settings → Data Import</p>
                </div>
              </div>
            )}

            {/* Step 7: Success */}
            {step === 7 && (
              <div className="text-center py-6">
                <div className="w-20 h-20 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} className="text-success" />
                </div>
                <h3 className="text-xl font-bold text-navy mb-2">Your workspace is ready!</h3>
                <p className="text-sm text-text-secondary mb-8 max-w-md mx-auto">
                  Welcome to Emergesun AMC Cloud. Your company profile has been set up. Here's what to do next:
                </p>
                <div className="grid grid-cols-2 gap-3 text-left max-w-md mx-auto mb-8">
                  {[
                    '✅ Company profile created',
                    '✅ First AMC plan configured',
                    '📋 Add your first customer',
                    '🏭 Register solar sites',
                    '👷 Add technicians',
                    '📄 Create AMC contracts',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                      {item}
                    </div>
                  ))}
                </div>
                <Button size="lg" onClick={handleFinish} rightIcon={<ArrowRight size={16} />}>
                  Go to Dashboard
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          {step < 7 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 1}
                leftIcon={<ArrowLeft size={14} />}
              >
                Back
              </Button>
              <div className="flex gap-3">
                {step >= 5 && (
                  <Button variant="ghost" onClick={() => step === 6 ? setStep(7) : handleNext()}>
                    Skip
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  loading={loading}
                  rightIcon={<ArrowRight size={14} />}
                >
                  {step === 6 ? 'Complete Setup' : 'Save & Continue'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
