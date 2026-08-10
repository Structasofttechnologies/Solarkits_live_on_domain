import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Building2, Globe, Users, Package, CreditCard, FileText, Settings, Activity } from 'lucide-react';
import { companies } from '../../mocks/companies';
import { StatusBadge } from '../../components/common/Badges';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { users } from '../../mocks/users';

const TABS = ['Overview', 'Countries', 'Users', 'Product Access', 'Subscription', 'Activity Logs', 'Settings'];

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const company = companies.find((c) => c.id === id) || companies[0];
  const [tab, setTab] = useState('Overview');
  const companyUsers = users.filter((u) => u.companyId === company.id);

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: 'Company Management', path: '/companies' }, { label: company.name }]} />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/companies')} className="btn-ghost btn-sm"><ArrowLeft size={16} /></button>
          <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-sm">{company.code}</div>
          <div>
            <h1 className="text-xl font-bold text-solar-navy">{company.name}</h1>
            <p className="text-solar-slate text-sm">{company.hqCountry} · {company.subscriptionPlan}</p>
          </div>
          <StatusBadge status={company.status} />
        </div>
        <button onClick={() => navigate(`/companies/${company.id}/edit`)} className="btn-primary btn-sm"><Edit2 size={14} /> Edit</button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Countries', value: company.operatingCountries.length, icon: Globe, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Users', value: company.totalUsers, icon: Users, color: 'text-green-600 bg-green-50' },
          { label: 'Active Products', value: company.activeProducts.length, icon: Package, color: 'text-purple-600 bg-purple-50' },
          { label: 'Country Admins', value: company.countryAdmins, icon: Building2, color: 'text-amber-600 bg-amber-50' },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}><s.icon size={18} /></div>
            <div><div className="text-xl font-bold text-solar-navy">{s.value}</div><div className="text-xs text-solar-slate">{s.label}</div></div>
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

      {/* Tab Content */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-solar-navy mb-4">Company Information</h3>
            <dl className="space-y-3">
              {[
                ['Legal Name', company.legalName],
                ['Company Code', company.code],
                ['Registration Number', company.registrationNumber],
                ['Tax ID', company.taxId],
                ['Website', company.website],
                ['Email', company.email],
                ['Phone', company.phone],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                  <dt className="text-solar-slate">{k}</dt>
                  <dd className="font-medium text-solar-navy text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-solar-navy mb-4">Headquarters</h3>
            <dl className="space-y-3">
              {[
                ['Country', company.hqCountry],
                ['State', company.hqState],
                ['City', company.hqCity],
                ['Address', company.address],
                ['Postal Code', company.postalCode],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                  <dt className="text-solar-slate">{k}</dt>
                  <dd className="font-medium text-solar-navy text-right">{v}</dd>
                </div>
              ))}
            </dl>
            <h3 className="font-semibold text-solar-navy mt-5 mb-3">Operating Countries</h3>
            <div className="flex flex-wrap gap-2">
              {company.operatingCountries.map((c) => (
                <span key={c} className="badge-primary">{c}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Users' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-solar-border">
            <h3 className="font-semibold text-solar-navy">{companyUsers.length} Users in {company.name}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead><tr><th>Name</th><th>Role</th><th>Country</th><th>Status</th></tr></thead>
              <tbody>
                {companyUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-medium text-solar-navy">{u.name}</div>
                      <div className="text-xs text-solar-slate">{u.email}</div>
                    </td>
                    <td><span className="badge-info">{u.role}</span></td>
                    <td className="text-sm">{u.country}</td>
                    <td><StatusBadge status={u.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Product Access' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {company.activeProducts.map((p) => (
            <div key={p} className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-accent-50 text-accent rounded-lg flex items-center justify-center"><Package size={18} /></div>
              <div className="font-medium text-solar-navy">{p}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Subscription' && (
        <div className="card p-6 max-w-lg">
          <h3 className="font-semibold text-solar-navy mb-4">Subscription Details</h3>
          <dl className="space-y-3">
            {[
              ['Plan', company.subscriptionPlan],
              ['Status', 'Active'],
              ['Expiry Date', company.subscriptionExpiry],
              ['Countries Allowed', company.operatingCountries.length],
              ['Total Users', company.totalUsers],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                <dt className="text-solar-slate">{k}</dt>
                <dd className="font-medium text-solar-navy">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex gap-3 mt-6">
            <button className="btn-primary btn-sm">Upgrade Plan</button>
            <button className="btn-outline btn-sm">Renew</button>
          </div>
        </div>
      )}

      {(tab === 'Countries' || tab === 'Activity Logs' || tab === 'Settings') && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-solar-navy mb-2">{tab}</h3>
          <p className="text-solar-slate text-sm">This section is ready for backend integration.</p>
        </div>
      )}
    </div>
  );
}
