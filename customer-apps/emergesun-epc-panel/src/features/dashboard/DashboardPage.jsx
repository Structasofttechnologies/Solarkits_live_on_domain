import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Globe, Users, UserCheck, UserX, UserMinus, Shield, UserPlus, Package, CreditCard, BarChart3, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import useStore from '../../store/useStore';
import KpiCard from '../../components/common/KpiCard';
import { analyticsData } from '../../mocks/index';
import { users } from '../../mocks/users';
import { companies } from '../../mocks/companies';
import { StatusBadge, RoleBadge, Avatar } from '../../components/common/Badges';

const COLORS = ['#28377F', '#F39220', '#308D08', '#35297E', '#58D38F', '#FF5733', '#0284C7', '#D97706'];

const kpis = [
  { label: 'Total Companies', value: '5', change: 0, icon: Building2, color: 'primary' },
  { label: 'Countries', value: '8', change: 14, icon: Globe, color: 'info' },
  { label: 'Total Users', value: '347', change: 8, icon: Users, color: 'purple' },
  { label: 'Active Users', value: '305', change: 5, icon: UserCheck, color: 'success' },
  { label: 'Inactive Users', value: '29', change: -3, icon: UserX, color: 'warning' },
  { label: 'Suspended', value: '13', change: -1, icon: UserMinus, color: 'error' },
  { label: 'Country Admins', value: '15', change: 2, icon: Shield, color: 'info' },
  { label: 'New This Month', value: '24', change: 12, icon: UserPlus, color: 'success' },
  { label: 'Active Products', value: '8', change: 0, icon: Package, color: 'secondary' },
  { label: 'Subscriptions', value: '5 Active', change: 0, icon: CreditCard, color: 'primary' },
];

const recentUsers = users.slice(0, 8);
const recentActivity = [
  { activity: 'User Created: David Chen', by: 'Arjun Mehta', company: 'SunTech', country: 'India', time: '2 hrs ago', status: 'success' },
  { activity: 'Role Updated: Sales', by: 'Priya Sharma', company: 'SunTech', country: 'India', time: '5 hrs ago', status: 'success' },
  { activity: 'User Suspended: Nomsa Zulu', by: 'Emily Johnson', company: 'GreenVolt', country: 'US', time: '1 day ago', status: 'warning' },
  { activity: 'Country Added: South Africa', by: 'Omar Al-Hassan', company: 'Desert Sun', country: 'UAE', time: '2 days ago', status: 'success' },
  { activity: 'Subscription Expiring: AfriSolar', by: 'System', company: 'AfriSolar', country: 'SA', time: '3 days ago', status: 'error' },
];

export default function DashboardPage() {
  const { user, selectedCountry } = useStore();
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solar-navy">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-solar-slate text-sm mt-0.5">
            {user?.role} · {user?.company} · {selectedCountry} · {today}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select className="select text-sm w-44">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>Last 90 Days</option>
            <option>This Year</option>
          </select>
          <button className="btn-outline btn-sm">
            <BarChart3 size={15} /> Export
          </button>
        </div>
      </div>

      {/* Subscription Expiry Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-amber-600">⚠️</span>
        <p className="text-sm text-amber-800">
          <strong>AfriSolar EPC</strong> subscription expires in <strong>16 days</strong>. Renew to avoid service interruption.
        </p>
        <button onClick={() => navigate('/subscriptions')} className="ml-auto text-xs text-amber-700 font-semibold underline flex-shrink-0">Renew</button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} icon={kpi.icon} label={kpi.label} value={kpi.value}
            change={kpi.change} changePeriod="vs last month" color={kpi.color}
            onClick={() => {}} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Growth */}
        <div className="chart-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">Monthly User Growth</h3>
            <span className="badge-success"><TrendingUp size={11} /> +12% MoM</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={analyticsData.monthlyUserGrowth}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#28377F" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#28377F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#627D98' }} />
              <YAxis tick={{ fontSize: 12, fill: '#627D98' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px' }} />
              <Area type="monotone" dataKey="users" stroke="#28377F" strokeWidth={2} fill="url(#colorUsers)" dot={{ r: 4, fill: '#28377F' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Product Wise */}
        <div className="chart-card">
          <h3 className="section-title">Product Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={analyticsData.productWiseUsers} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" nameKey="name">
                {analyticsData.productWiseUsers.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Country Wise */}
        <div className="chart-card">
          <h3 className="section-title">Country-wise Users</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData.countryWiseUsers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#627D98' }} />
              <YAxis dataKey="country" type="category" tick={{ fontSize: 11, fill: '#627D98' }} width={60} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="users" fill="#28377F" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Role Wise */}
        <div className="chart-card">
          <h3 className="section-title">Role Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData.roleWiseUsers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#627D98' }} />
              <YAxis tick={{ fontSize: 11, fill: '#627D98' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="value" fill="#F39220" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Users */}
        <div className="card lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-solar-border">
            <h3 className="font-semibold text-solar-navy">Recent Users</h3>
            <button onClick={() => navigate('/users')} className="text-xs text-primary font-medium hover:underline">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Country</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="cursor-pointer" onClick={() => navigate(`/users/${u.id}`)}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <div className="font-medium text-solar-navy">{u.name}</div>
                          <div className="text-xs text-solar-slate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">{u.country}</div>
                    </td>
                    <td><RoleBadge role={u.role} code={u.roleCode} /></td>
                    <td><StatusBadge status={u.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-solar-border">
            <h3 className="font-semibold text-solar-navy">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivity.map((a, i) => (
              <div key={i} className="px-5 py-3">
                <p className="text-xs font-medium text-solar-navy mb-0.5">{a.activity}</p>
                <p className="text-xs text-solar-slate">by {a.by} · {a.company}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">{a.time}</span>
                  <StatusBadge status={a.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
