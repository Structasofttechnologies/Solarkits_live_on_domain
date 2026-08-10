import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Globe, Users, Eye, Edit2, Shield, Ban, CheckCircle } from 'lucide-react';
import { countries } from '../../mocks/geoData';
import { StatusBadge } from '../../components/common/Badges';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import toast from 'react-hot-toast';

const mockCountryData = countries.map((c, i) => ({
  ...c,
  company: ['SunTech Energy Solutions', 'GreenVolt Power', 'Desert Sun EPC', 'BrightField Solar', 'AfriSolar EPC'][i % 5],
  countryAdmin: ['Ravi Kumar', 'Emily Johnson', 'Fatima Al-Zahra', 'Felix Wagner', 'Sipho Dlamini'][i % 5],
  totalUsers: [98, 72, 54, 43, 31, 27, 19, 15][i],
  activeUsers: [87, 65, 48, 38, 27, 22, 14, 12][i],
  assignedProducts: [4, 3, 3, 2, 3, 2, 2, 1][i],
  subscription: ['Enterprise', 'Professional', 'Professional', 'Starter', 'Enterprise', 'Professional', 'Starter', 'Professional'][i],
  status: i === 6 ? 'suspended' : 'active',
}));

export default function CountriesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [data, setData] = useState(mockCountryData);

  const filtered = data.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id) => {
    setData((prev) => {
      const updated = prev.map((c) => c.id === id ? { ...c, status: c.status === 'active' ? 'suspended' : 'active' } : c);
      const activeOnly = updated.filter((c) => c.status === 'active').map((c) => ({
        code: c.code,
        name: c.name,
        dial: c.code === 'IN' ? '+91' : c.code === 'US' ? '+1' : c.code === 'AE' ? '+971' : c.code === 'GB' ? '+44' : c.code === 'AU' ? '+61' : c.code === 'DE' ? '+49' : c.code === 'SG' ? '+65' : '+27',
        flag: c.flag,
        status: 'active'
      }));
      localStorage.setItem('epc_active_countries', JSON.stringify(activeOnly));
      return updated;
    });
    toast.success('Country access status updated in Setup Location');
  };

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: 'Country Administration' }]} />
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-solar-navy">Country Administration</h1>
          <p className="text-solar-slate text-sm mt-0.5">{data.length} countries configured</p>
        </div>
        <button onClick={() => navigate('/countries/create')} className="btn-primary">
          <Plus size={16} /> Add Country
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total Countries', value: data.length, color: 'text-primary bg-primary-50' },
          { label: 'Active', value: data.filter((c) => c.status === 'active').length, color: 'text-green-600 bg-green-50' },
          { label: 'Suspended', value: data.filter((c) => c.status === 'suspended').length, color: 'text-red-600 bg-red-50' },
          { label: 'Country Admins', value: data.filter((c) => c.countryAdmin).length, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Users', value: data.reduce((s, c) => s + c.totalUsers, 0), color: 'text-purple-600 bg-purple-50' },
          { label: 'Active Users', value: data.reduce((s, c) => s + c.activeUsers, 0), color: 'text-accent bg-accent-50' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`text-xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</div>
            <div className="text-xs text-solar-slate mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card p-4 mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-solar-slate" />
          <input className="input pl-9" placeholder="Search countries..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select text-sm w-40">
          <option>All Companies</option>
          <option>SunTech Energy</option>
          <option>GreenVolt Power</option>
          <option>Desert Sun EPC</option>
        </select>
        <select className="select text-sm w-36">
          <option>All Status</option>
          <option>Active</option>
          <option>Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Country</th>
                <th>Company</th>
                <th>Country Admin</th>
                <th>Users</th>
                <th>Products</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{c.flag}</span>
                      <div>
                        <div className="font-medium text-solar-navy">{c.name}</div>
                        <div className="text-xs text-solar-slate">{c.code} · {c.currency}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">{c.company}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                        {c.countryAdmin?.charAt(0)}
                      </div>
                      <span className="text-sm">{c.countryAdmin}</span>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm font-medium">{c.totalUsers}</div>
                    <div className="text-xs text-solar-slate">{c.activeUsers} active</div>
                  </td>
                  <td className="text-sm">{c.assignedProducts} products</td>
                  <td><span className="badge-info">{c.subscription}</span></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/countries/${c.id}`)} className="btn-icon btn-ghost btn-sm" title="View"><Eye size={15} /></button>
                      <button onClick={() => navigate(`/countries/${c.id}/edit`)} className="btn-icon btn-ghost btn-sm" title="Edit"><Edit2 size={15} /></button>
                      <button className="btn-icon btn-ghost btn-sm" title="Assign Admin"><Shield size={15} className="text-blue-500" /></button>
                      <button onClick={() => toggleStatus(c.id)} className="btn-icon btn-ghost btn-sm" title="Toggle">
                        {c.status === 'active' ? <Ban size={15} className="text-amber-500" /> : <CheckCircle size={15} className="text-green-500" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
