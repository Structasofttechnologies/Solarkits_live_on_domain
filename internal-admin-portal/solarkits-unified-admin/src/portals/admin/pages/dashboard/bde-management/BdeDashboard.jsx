import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUserTie,
  FaUserCheck,
  FaUserClock,
  FaUserSlash,
  FaMapMarkedAlt,
  FaPlus,
  FaBullseye,
  FaHistory,
  FaArrowRight,
  FaShieldAlt,
} from 'react-icons/fa';
import { bdeApi } from '../../../api/bdeApi';
import Loader from '../../../components/Loader';

export default function BdeDashboard({ moduleUniqueId = 'ADM_BDE_MGMT' }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await bdeApi.getDashboardStats(moduleUniqueId);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load BDE dashboard stats', err);
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader text="Loading BDE Dashboard..." />;

  const statCards = [
    {
      title: 'Total BDEs',
      value: stats?.total_bdes || 0,
      icon: <FaUserTie className="text-2xl text-[#0575B8]" />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      textColor: 'text-[#0575B8]',
    },
    {
      title: 'Active BDEs',
      value: stats?.active_bdes || 0,
      icon: <FaUserCheck className="text-2xl text-emerald-600" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      textColor: 'text-emerald-700',
    },
    {
      title: 'KYC Pending',
      value: stats?.kyc_pending_bdes || 0,
      icon: <FaUserClock className="text-2xl text-amber-600" />,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      textColor: 'text-amber-700',
    },
    {
      title: 'Suspended / Inactive',
      value: (stats?.suspended_bdes || 0) + (stats?.inactive_bdes || 0),
      icon: <FaUserSlash className="text-2xl text-rose-600" />,
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      textColor: 'text-rose-700',
    },
    {
      title: 'Active Territories',
      value: stats?.active_territories_count || 0,
      icon: <FaMapMarkedAlt className="text-2xl text-indigo-600" />,
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      textColor: 'text-indigo-700',
    },
  ];

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50 via-slate-50 to-white border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-[#0575B8] rounded-full text-xs font-bold uppercase tracking-wider mb-1">
              <FaShieldAlt /> SolarKits BDE Subsystem
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">BDE Executive Management</h1>
            <p className="text-sm text-slate-500 font-medium max-w-2xl">
              Manage field Business Development Executives, review KYC documents, assign state and district territories, set franchisee signup goals, and monitor activity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/admin-panel/bde-management/create')}
              className="px-5 py-2.5 bg-[#0575B8] hover:bg-[#045D93] text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <FaPlus /> Create New BDE
            </button>
            <button
              onClick={() => navigate('/admin-panel/bde-management/all')}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              View All BDEs <FaArrowRight className="text-xs" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`p-5 rounded-3xl bg-white border ${card.border} shadow-sm hover:shadow-md transition flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">{card.title}</span>
              <div className={`p-2.5 rounded-2xl ${card.bg}`}>{card.icon}</div>
            </div>
            <div className="mt-4">
              <span className={`text-3xl font-black ${card.textColor}`}>{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/admin-panel/bde-management/territory-assignment')}
          className="p-6 bg-white rounded-3xl border border-slate-200 hover:border-[#0575B8] hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-105 transition">
              <FaMapMarkedAlt className="text-xl" />
            </div>
            <FaArrowRight className="text-slate-400 group-hover:text-[#0575B8] transition" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Territory & District Management</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Assign and reallocate states, multiple districts, and priorities to active BDEs.
          </p>
        </div>

        <div
          onClick={() => navigate('/admin-panel/bde-management/goal-assignment')}
          className="p-6 bg-white rounded-3xl border border-slate-200 hover:border-[#0575B8] hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-105 transition">
              <FaBullseye className="text-xl" />
            </div>
            <FaArrowRight className="text-slate-400 group-hover:text-[#0575B8] transition" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Target & Goal Assignment</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Assign monthly/quarterly franchisee signup goals and operational store setup metrics.
          </p>
        </div>

        <div
          onClick={() => navigate('/admin-panel/bde-management/activity-history')}
          className="p-6 bg-white rounded-3xl border border-slate-200 hover:border-[#0575B8] hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-50 text-[#0575B8] rounded-2xl group-hover:scale-105 transition">
              <FaHistory className="text-xl" />
            </div>
            <FaArrowRight className="text-slate-400 group-hover:text-[#0575B8] transition" />
          </div>
          <h3 className="text-base font-bold text-slate-900">BDE Activity & Audit Logs</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            View full historical event log of territory changes, KYC approvals, and status transitions.
          </p>
        </div>
      </div>

      {/* Recently Registered BDEs Table */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Recently Registered BDEs</h2>
            <p className="text-xs text-slate-500 font-medium">Latest field executives added to the platform</p>
          </div>
          <button
            onClick={() => navigate('/admin-panel/bde-management/all')}
            className="text-xs font-bold text-[#0575B8] hover:underline flex items-center gap-1 cursor-pointer"
          >
            View All BDEs <FaArrowRight className="text-[10px]" />
          </button>
        </div>

        {stats?.recent_bdes && stats.recent_bdes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">BDE ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">State / District</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recent_bdes.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-[#0575B8]">{b.bde_id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{b.full_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{b.mobile_number}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs font-medium">
                      {b.state_name || 'Unassigned'} {b.district_name ? `(${b.district_name})` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        b.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : b.status === 'suspended'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/admin-panel/bde-management/profile/${b._id}`)}
                        className="text-xs font-bold text-[#0575B8] hover:underline cursor-pointer"
                      >
                        Manage Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-slate-500 font-medium">
            No BDE profiles found. Click "Create New BDE" to add one.
          </div>
        )}
      </div>
    </div>
  );
}
