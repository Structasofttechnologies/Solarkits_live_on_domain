// src/pages/settings/SettingsPage.jsx
import { useState } from 'react';
import { Settings, Building2, Bell, Shield, Database, Lock, Save, Globe, Plus, Check, Flag, MapPin } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Drawer from '../../components/common/Drawer';
import { toast } from '../../hooks';
import { ALL_COUNTRIES, getCountryByName } from '../../constants';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');

  // Country Master State
  const [operationalCountries, setOperationalCountries] = useState(ALL_COUNTRIES);
  const [showAddCountryDrawer, setShowAddCountryDrawer] = useState(false);
  const [newCountryForm, setNewCountryForm] = useState({
    name: '',
    code: '',
    flag: '🌐',
    currency: 'USD ($)',
    dialCode: '+1',
    taxLabel: 'VAT / Tax ID',
    taxPlaceholder: 'Tax ID'
  });

  // Company Form State
  const [company, setCompany] = useState({
    name: 'Emergesun Energy Pvt. Ltd.',
    gst: '24AABCE1234Z1Z5',
    email: 'contact@emergesun.com',
    phone: '+91 98765 43210',
    address: 'Solar Tower, Ring Road, Rajkot',
    country: 'India',
    state: 'Gujarat',
    city: 'Rajkot',
    currency: 'INR (₹)',
    prefix: 'EMG-AMC-',
  });

  // Selected country object derived from state
  const selectedCountryObj = getCountryByName(company.country);

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState({
    emailRenewals: true,
    emailBreaches: true,
    whatsappVisits: true,
    smsAlerts: false,
    dailyDigest: true,
  });

  const handleCountryChange = (countryName) => {
    const matched = getCountryByName(countryName);
    setCompany(prev => ({
      ...prev,
      country: countryName,
      currency: matched.currency,
      state: matched.states ? matched.states[0] : '',
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Settings updated successfully!');
  };

  const handleToggleCountryStatus = (code) => {
    setOperationalCountries(prev =>
      prev.map(c => c.code === code ? { ...c, active: !c.active } : c)
    );
    toast.success('Country operational status updated');
  };

  const handleSetDefaultCountry = (code) => {
    setOperationalCountries(prev =>
      prev.map(c => ({ ...c, isDefault: c.code === code }))
    );
    toast.success('Default operating country updated');
  };

  const handleAddCountrySubmit = (e) => {
    e.preventDefault();
    if (!newCountryForm.name || !newCountryForm.code) {
      toast.error('Please enter country name and code');
      return;
    }
    const created = {
      ...newCountryForm,
      active: true,
      states: ['Central', 'North', 'South']
    };
    setOperationalCountries(prev => [...prev, created]);
    toast.success(`Country ${newCountryForm.name} added to operational list!`);
    setShowAddCountryDrawer(false);
    setNewCountryForm({
      name: '',
      code: '',
      flag: '🌐',
      currency: 'USD ($)',
      dialCode: '+1',
      taxLabel: 'VAT / Tax ID',
      taxPlaceholder: 'Tax ID'
    });
  };

  return (
    <div className="page-container max-w-5xl">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Settings size={22} className="text-solar" />
            Company & System Settings
          </h1>
          <p className="page-subtitle">Manage organization settings, branding, international country master, notifications, and branch configurations</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Navigation Tabs */}
        <div className="tab-bar px-5 overflow-x-auto">
          {[
            { id: 'company', label: 'Company Profile', icon: Building2 },
            { id: 'countries', label: 'Countries & Regions', icon: Globe },
            { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
            { id: 'branches', label: 'Branches & Zones', icon: MapPin },
            { id: 'security', label: 'Security & SSO', icon: Lock },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-selected={activeTab === tab.id}
                className={`tab-item flex items-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Company Profile Tab */}
          {activeTab === 'company' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Company Legal Name</label>
                  <input
                    value={company.name}
                    onChange={e => setCompany({ ...company, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">{selectedCountryObj.taxLabel || 'Tax ID / GSTIN'}</label>
                  <input
                    value={company.gst}
                    onChange={e => setCompany({ ...company, gst: e.target.value })}
                    placeholder={selectedCountryObj.taxPlaceholder || 'Tax ID'}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Official Email</label>
                  <input
                    type="email"
                    value={company.email}
                    onChange={e => setCompany({ ...company, email: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Phone Number ({selectedCountryObj.dialCode})</label>
                  <input
                    value={company.phone}
                    onChange={e => setCompany({ ...company, phone: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Head Office Address</label>
                  <input
                    value={company.address}
                    onChange={e => setCompany({ ...company, address: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Country</label>
                  <select
                    value={company.country}
                    onChange={e => handleCountryChange(e.target.value)}
                    className="form-select"
                  >
                    {operationalCountries.filter(c => c.active).map(c => (
                      <option key={c.code} value={c.name}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">State / Province</label>
                  {selectedCountryObj.states && selectedCountryObj.states.length > 0 ? (
                    <select
                      value={company.state}
                      onChange={e => setCompany({ ...company, state: e.target.value })}
                      className="form-select"
                    >
                      {selectedCountryObj.states.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={company.state}
                      onChange={e => setCompany({ ...company, state: e.target.value })}
                      className="form-input"
                      placeholder="State or Region"
                    />
                  )}
                </div>

                <div>
                  <label className="form-label">City</label>
                  <input
                    value={company.city}
                    onChange={e => setCompany({ ...company, city: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Base Operating Currency</label>
                  <input
                    value={company.currency}
                    disabled
                    className="form-input bg-gray-100 cursor-not-allowed font-medium text-navy"
                  />
                </div>

                <div>
                  <label className="form-label">Contract Numbering Prefix</label>
                  <input
                    value={company.prefix}
                    onChange={e => setCompany({ ...company, prefix: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button type="submit" leftIcon={<Save size={15} />}>
                  Save Settings
                </Button>
              </div>
            </form>
          )}

          {/* Countries & Regions Master Tab */}
          {activeTab === 'countries' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-bold text-navy flex items-center gap-2">
                    <Globe size={18} className="text-solar" />
                    Operational Country Master
                  </h3>
                  <p className="text-xs text-text-secondary">Configure operating countries, regional tax codes, currencies, and state structures</p>
                </div>
                <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowAddCountryDrawer(true)}>
                  Add Operational Country
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {operationalCountries.map(c => (
                  <div
                    key={c.code}
                    className={`p-4 rounded-xl border transition-all ${
                      c.isDefault ? 'border-solar bg-solar/5 shadow-sm' : 'border-border bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl leading-none">{c.flag}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-navy text-sm">{c.name}</h4>
                            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-100 text-text-secondary">
                              {c.code}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">{c.currency} • {c.dialCode}</p>
                        </div>
                      </div>

                      {c.isDefault && (
                        <span className="px-2 py-0.5 text-xxs font-bold text-solar bg-solar/20 rounded-full flex items-center gap-1">
                          <Check size={10} /> Default
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/60 text-xs space-y-1 text-text-secondary">
                      <div className="flex justify-between">
                        <span>Tax System:</span>
                        <span className="font-medium text-navy">{c.taxLabel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>States/Provinces:</span>
                        <span className="font-medium text-navy">{c.states ? c.states.length : 0} regions</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 pt-2">
                      <button
                        onClick={() => handleToggleCountryStatus(c.code)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                          c.active
                            ? 'bg-success/10 text-success hover:bg-success/20'
                            : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                        }`}
                      >
                        {c.active ? 'Active' : 'Inactive'}
                      </button>

                      {!c.isDefault && c.active && (
                        <button
                          onClick={() => handleSetDefaultCountry(c.code)}
                          className="text-xs text-solar font-medium hover:underline"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-navy">Notification Channels & Triggers</h3>
              <div className="space-y-4">
                {[
                  { key: 'emailRenewals', label: 'Email Reminders for Expiring Contracts', desc: 'Automatically email customer 60, 30, and 15 days before AMC expiration' },
                  { key: 'emailBreaches', label: 'SLA Breach Notifications', desc: 'Notify Service Manager immediately when a ticket breaches SLA response time' },
                  { key: 'whatsappVisits', label: 'WhatsApp Job Dispatch to Technicians', desc: 'Send service visit details and customer GPS location to technician WhatsApp' },
                  { key: 'smsAlerts', label: 'Customer SMS Notifications', desc: 'Send SMS to customers when technician checks in at their site' },
                  { key: 'dailyDigest', label: 'Daily Executive Digest', desc: 'Send daily summary report to EPC Owner at 8:00 AM' },
                ].map(item => (
                  <div key={item.key} className="flex items-start justify-between p-4 rounded-lg border border-border bg-gray-50/50">
                    <div>
                      <p className="font-semibold text-navy text-sm">{item.label}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs[item.key]}
                      onChange={e => {
                        setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked });
                        toast.success('Preference updated');
                      }}
                      className="mt-1 h-4 w-4 text-solar border-border rounded focus:ring-solar"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Branches Tab */}
          {activeTab === 'branches' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-navy">Active Branches</h3>
                <Button size="xs" onClick={() => toast.info('Add Branch modal...')}>+ Add Branch</Button>
              </div>
              {[
                { name: 'Rajkot HQ', manager: 'Rajesh Kumar', country: 'India', sites: 142, status: 'Active' },
                { name: 'Ahmedabad Branch', manager: 'Vikram Singh', country: 'India', sites: 98, status: 'Active' },
                { name: 'Surat Branch', manager: 'Amit Sharma', country: 'India', sites: 64, status: 'Active' },
                { name: 'Mumbai Branch', manager: 'Neha Joshi', country: 'India', sites: 32, status: 'Active' },
              ].map(b => (
                <div key={b.name} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-semibold text-navy text-sm">{b.name}</p>
                    <p className="text-xs text-text-secondary">Manager: {b.manager} • Country: {b.country} • {b.sites} Sites Monitored</p>
                  </div>
                  <span className="text-xs font-semibold text-success bg-success-50 px-2 py-1 rounded">
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-navy">Security Settings</h3>
              <div className="p-4 border border-border rounded-lg bg-gray-50/50 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-navy text-sm">Two-Factor Authentication (2FA)</p>
                    <p className="text-xs text-text-secondary">Require 2FA for all admin users</p>
                  </div>
                  <Button size="xs" variant="outline" onClick={() => toast.info('Configuring 2FA...')}>Configure</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Country Drawer */}
      <Drawer
        isOpen={showAddCountryDrawer}
        onClose={() => setShowAddCountryDrawer(false)}
        title="Add New Operational Country"
        subtitle="Expand AMC operations to a new international region"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddCountryDrawer(false)}>Cancel</Button>
            <Button onClick={handleAddCountrySubmit}>Add Country</Button>
          </>
        }
      >
        <form onSubmit={handleAddCountrySubmit} className="space-y-4">
          <div>
            <label className="form-label">Country Name *</label>
            <input
              value={newCountryForm.name}
              onChange={e => setNewCountryForm({ ...newCountryForm, name: e.target.value })}
              placeholder="e.g. New Zealand"
              className="form-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Country Code (ISO) *</label>
              <input
                value={newCountryForm.code}
                onChange={e => setNewCountryForm({ ...newCountryForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g. NZ"
                maxLength={3}
                className="form-input uppercase"
                required
              />
            </div>
            <div>
              <label className="form-label">Flag Emoji</label>
              <input
                value={newCountryForm.flag}
                onChange={e => setNewCountryForm({ ...newCountryForm, flag: e.target.value })}
                placeholder="🇳🇿"
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Currency</label>
              <input
                value={newCountryForm.currency}
                onChange={e => setNewCountryForm({ ...newCountryForm, currency: e.target.value })}
                placeholder="NZD ($)"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Dial Code</label>
              <input
                value={newCountryForm.dialCode}
                onChange={e => setNewCountryForm({ ...newCountryForm, dialCode: e.target.value })}
                placeholder="+64"
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Tax Label (e.g. GSTIN, VAT, Tax ID)</label>
            <input
              value={newCountryForm.taxLabel}
              onChange={e => setNewCountryForm({ ...newCountryForm, taxLabel: e.target.value })}
              placeholder="GST Number"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Tax ID Example / Placeholder</label>
            <input
              value={newCountryForm.taxPlaceholder}
              onChange={e => setNewCountryForm({ ...newCountryForm, taxPlaceholder: e.target.value })}
              placeholder="123-456-789"
              className="form-input"
            />
          </div>
        </form>
      </Drawer>
    </div>
  );
}
