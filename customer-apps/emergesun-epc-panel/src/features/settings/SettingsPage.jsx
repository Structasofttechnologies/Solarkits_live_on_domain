import React, { useState } from 'react';
import { Building2, Globe, Lock, Bell, User, Palette, Database, Shield } from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'company', label: 'Company Profile', icon: Building2 },
  { id: 'localization', label: 'Localization', icon: Globe },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'data', label: 'Data Export', icon: Database },
];

const ToggleSwitch = ({ value, onChange, label }) => (
  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
    <span className="text-sm font-medium text-solar-navy">{label}</span>
    <div onClick={() => onChange(!value)} className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${value ? 'bg-primary' : 'bg-gray-300'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-1'}`} />
    </div>
  </label>
);

export default function SettingsPage() {
  const [tab, setTab] = useState('company');
  const [company, setCompany] = useState({ name: 'SunTech Energy Solutions', email: 'admin@suntech.com', phone: '+91-98765-43210', website: 'https://suntech.com' });
  const [security, setSecurity] = useState({ minLength: 8, maxAttempts: 5, sessionExpiry: 60, twoFactor: false, ipRestriction: false, concurrentSessions: 3 });
  const [notifSettings, setNotifSettings] = useState({ userCreated: true, userSuspended: true, subscription: true, loginAlert: false, roleChanges: true });
  const [branding, setBranding] = useState({ companyName: 'Emergesun EPC', loginTitle: 'Welcome to Emergesun', primaryColor: '#28377F', secondaryColor: '#F39220', footerText: 'Emergesun EPC Management Platform' });
  const [localization, setLocalization] = useState({ language: 'English', currency: 'USD', timezone: 'Asia/Kolkata', dateFormat: 'DD/MM/YYYY' });

  const save = () => toast.success('Settings saved successfully!');

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: 'Settings' }]} />
      <div className="page-header">
        <h1 className="text-2xl font-bold text-solar-navy">Settings</h1>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar nav */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="card p-2 space-y-0.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                    ${tab === t.id ? 'bg-primary text-white' : 'text-solar-slate hover:bg-gray-100 hover:text-solar-navy'}`}>
                  <Icon size={15} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === 'company' && (
            <div className="card p-6">
              <h2 className="section-title">Company Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ['Company Name', 'name', 'text'], ['Email', 'email', 'email'],
                  ['Phone', 'phone', 'text'], ['Website', 'website', 'url'],
                ].map(([label, key, type]) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input className="input" type={type} value={company[key]} onChange={(e) => setCompany((c) => ({ ...c, [key]: e.target.value }))} />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="label">Company Logo</label>
                  <div className="border-2 border-dashed border-solar-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors">
                    <div className="text-3xl mb-2">🏢</div>
                    <p className="text-sm text-solar-slate">Click to upload logo (PNG, SVG, max 2MB)</p>
                  </div>
                </div>
              </div>
              <button onClick={save} className="btn-primary mt-4">Save Company Profile</button>
            </div>
          )}

          {tab === 'localization' && (
            <div className="card p-6">
              <h2 className="section-title">Localization</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Default Language</label>
                  <select className="select" value={localization.language} onChange={(e) => setLocalization((l) => ({ ...l, language: e.target.value }))}>
                    <option>English</option><option>Arabic</option><option>German</option><option>Hindi</option>
                  </select>
                </div>
                <div>
                  <label className="label">Default Currency</label>
                  <select className="select" value={localization.currency} onChange={(e) => setLocalization((l) => ({ ...l, currency: e.target.value }))}>
                    <option>USD</option><option>INR</option><option>AED</option><option>GBP</option><option>EUR</option><option>AUD</option>
                  </select>
                </div>
                <div>
                  <label className="label">Timezone</label>
                  <select className="select" value={localization.timezone} onChange={(e) => setLocalization((l) => ({ ...l, timezone: e.target.value }))}>
                    <option>Asia/Kolkata</option><option>America/Los_Angeles</option><option>Europe/London</option><option>Asia/Dubai</option><option>Europe/Berlin</option>
                  </select>
                </div>
                <div>
                  <label className="label">Date Format</label>
                  <select className="select" value={localization.dateFormat} onChange={(e) => setLocalization((l) => ({ ...l, dateFormat: e.target.value }))}>
                    <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
              <button onClick={save} className="btn-primary mt-4">Save Localization</button>
            </div>
          )}

          {tab === 'security' && (
            <div className="card p-6 space-y-6">
              <h2 className="section-title">Security Settings</h2>
              <div>
                <h3 className="font-semibold text-solar-navy mb-3 text-sm">Password Policy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ['Minimum Length', 'minLength', 6, 32],
                    ['Max Login Attempts', 'maxAttempts', 3, 10],
                    ['Session Expiry (minutes)', 'sessionExpiry', 15, 480],
                    ['Concurrent Sessions', 'concurrentSessions', 1, 10],
                  ].map(([label, key, min, max]) => (
                    <div key={key}>
                      <label className="label">{label}</label>
                      <input className="input" type="number" min={min} max={max} value={security[key]} onChange={(e) => setSecurity((s) => ({ ...s, [key]: Number(e.target.value) }))} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-solar-navy mb-3 text-sm">Advanced Security</h3>
                <div className="space-y-2">
                  <ToggleSwitch value={security.twoFactor} onChange={(v) => setSecurity((s) => ({ ...s, twoFactor: v }))} label="Enforce Two-Factor Authentication" />
                  <ToggleSwitch value={security.ipRestriction} onChange={(v) => setSecurity((s) => ({ ...s, ipRestriction: v }))} label="Enable IP Restriction (Placeholder)" />
                </div>
              </div>
              <button onClick={save} className="btn-primary">Save Security Settings</button>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="card p-6">
              <h2 className="section-title">Notification Preferences</h2>
              <div className="space-y-2">
                <ToggleSwitch value={notifSettings.userCreated} onChange={(v) => setNotifSettings((n) => ({ ...n, userCreated: v }))} label="Notify on new user creation" />
                <ToggleSwitch value={notifSettings.userSuspended} onChange={(v) => setNotifSettings((n) => ({ ...n, userSuspended: v }))} label="Notify on user suspension" />
                <ToggleSwitch value={notifSettings.subscription} onChange={(v) => setNotifSettings((n) => ({ ...n, subscription: v }))} label="Subscription expiry alerts" />
                <ToggleSwitch value={notifSettings.loginAlert} onChange={(v) => setNotifSettings((n) => ({ ...n, loginAlert: v }))} label="Login from new device alerts" />
                <ToggleSwitch value={notifSettings.roleChanges} onChange={(v) => setNotifSettings((n) => ({ ...n, roleChanges: v }))} label="Role and permission change alerts" />
              </div>
              <button onClick={save} className="btn-primary mt-4">Save Preferences</button>
            </div>
          )}

          {tab === 'branding' && (
            <div className="card p-6">
              <h2 className="section-title">Branding Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[
                  ['Company Display Name', 'companyName'], ['Login Screen Title', 'loginTitle'], ['Email Footer Text', 'footerText'],
                ].map(([label, key]) => (
                  <div key={key} className={key === 'footerText' ? 'md:col-span-2' : ''}>
                    <label className="label">{label}</label>
                    <input className="input" value={branding[key]} onChange={(e) => setBranding((b) => ({ ...b, [key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label className="label">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={branding.primaryColor} onChange={(e) => setBranding((b) => ({ ...b, primaryColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border border-solar-border" />
                    <input className="input flex-1" value={branding.primaryColor} onChange={(e) => setBranding((b) => ({ ...b, primaryColor: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="label">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={branding.secondaryColor} onChange={(e) => setBranding((b) => ({ ...b, secondaryColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border border-solar-border" />
                    <input className="input flex-1" value={branding.secondaryColor} onChange={(e) => setBranding((b) => ({ ...b, secondaryColor: e.target.value }))} />
                  </div>
                </div>
              </div>
              {/* Preview */}
              <div className="border-2 border-dashed border-solar-border rounded-xl p-4 mb-4">
                <div className="text-xs text-solar-slate mb-2 font-semibold">Preview</div>
                <div className="rounded-xl p-4" style={{ backgroundColor: branding.primaryColor }}>
                  <div className="text-white font-bold text-sm">{branding.companyName}</div>
                  <div className="text-white/70 text-xs">{branding.loginTitle}</div>
                  <div className="mt-2 inline-block px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: branding.secondaryColor, color: '#102A43' }}>Sample Button</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div>
                  <label className="label">Logo Upload</label>
                  <div className="border-2 border-dashed border-solar-border rounded-lg p-4 text-center cursor-pointer hover:border-primary text-xs text-solar-slate">Click to upload (PNG/SVG)</div>
                </div>
                <div>
                  <label className="label">Favicon Upload</label>
                  <div className="border-2 border-dashed border-solar-border rounded-lg p-4 text-center cursor-pointer hover:border-primary text-xs text-solar-slate">Click to upload (ICO/PNG)</div>
                </div>
              </div>
              <button onClick={save} className="btn-primary">Save Branding</button>
            </div>
          )}

          {tab === 'data' && (
            <div className="card p-6">
              <h2 className="section-title">Data Export</h2>
              <div className="space-y-3">
                {['All Users', 'All Companies', 'All Countries', 'Audit Logs', 'Subscription Data', 'Product Access Matrix'].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-solar-navy">{item}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toast.success(`${item} exported as CSV`)} className="btn-outline btn-sm">CSV</button>
                      <button onClick={() => toast.success(`${item} exported as Excel`)} className="btn-outline btn-sm">Excel</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
