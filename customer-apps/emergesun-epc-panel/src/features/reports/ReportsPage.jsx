import React from 'react';
import { BarChart3, Download, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { analyticsData } from '../../mocks/index';
import toast from 'react-hot-toast';

const COLORS = ['#28377F', '#F39220', '#308D08', '#35297E', '#58D38F', '#FF5733', '#0284C7', '#D97706'];

const reportCards = [
  { title: 'User Growth Report', desc: 'Monthly user registration trends across all companies', icon: '📈', format: 'PDF/Excel' },
  { title: 'Country Analytics Report', desc: 'User distribution and activity by country', icon: '🌍', format: 'PDF/Excel' },
  { title: 'Product Usage Report', desc: 'Module-wise usage statistics and adoption rates', icon: '📦', format: 'PDF/CSV' },
  { title: 'Role Distribution Report', desc: 'User count by role across companies and countries', icon: '🛡️', format: 'PDF/Excel' },
  { title: 'Subscription Status Report', desc: 'Active, expiring, and expired subscriptions', icon: '💳', format: 'PDF/Excel' },
  { title: 'Audit Activity Report', desc: 'Admin actions and system events log', icon: '📋', format: 'CSV/PDF' },
];

export default function ReportsPage() {
  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: 'Reports & Analytics' }]} />
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-solar-navy">Reports & Analytics</h1>
          <p className="text-solar-slate text-sm mt-0.5">Generate, view, and export data-driven reports</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="select text-sm w-36"><option>Last 30 Days</option><option>Last 90 Days</option><option>This Year</option></select>
          <select className="select text-sm w-36"><option>All Companies</option></select>
          <select className="select text-sm w-36"><option>All Countries</option></select>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="chart-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-solar-navy">Monthly User Growth</h3>
            <button onClick={() => toast.success('Report exported!')} className="btn-outline btn-sm"><Download size={13} /> Export</button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analyticsData.monthlyUserGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#28377F" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-solar-navy">Country-wise Distribution</h3>
            <button onClick={() => toast.success('Report exported!')} className="btn-outline btn-sm"><Download size={13} /> Export</button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData.countryWiseUsers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="country" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="users" fill="#F39220" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-solar-navy">Product-wise Users</h3>
            <button onClick={() => toast.success('Report exported!')} className="btn-outline btn-sm"><Download size={13} /> Export</button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={analyticsData.productWiseUsers} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                {analyticsData.productWiseUsers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-solar-navy">Active vs Inactive Users</h3>
            <button onClick={() => toast.success('Report exported!')} className="btn-outline btn-sm"><Download size={13} /> Export</button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={analyticsData.activeVsInactive} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                {analyticsData.activeVsInactive.map((_, i) => <Cell key={i} fill={['#22A06B', '#F59E0B', '#DC2626'][i]} />)}
              </Pie>
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Downloadable Reports */}
      <h2 className="section-title">Downloadable Reports</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((r) => (
          <div key={r.title} className="card p-5 card-hover">
            <div className="text-3xl mb-3">{r.icon}</div>
            <h3 className="font-semibold text-solar-navy mb-1">{r.title}</h3>
            <p className="text-xs text-solar-slate mb-3">{r.desc}</p>
            <div className="flex items-center justify-between">
              <span className="badge-neutral">{r.format}</span>
              <button onClick={() => toast.success(`${r.title} download started!`)} className="btn-outline btn-sm">
                <Download size={13} /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
