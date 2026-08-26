import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  RotateCw, 
  MapPin, 
  Users, 
  Calendar,
  Eye,
  X,
  Info
} from 'lucide-react';
import api from '../services/api';

export default function BdeStoreSetup() {
  const [setups, setSetups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSetup, setSelectedSetup] = useState(null);

  const fetchSetups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/store-setup');
      if (res.data?.status === 'success') {
        setSetups(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch store setups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetups();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RotateCw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  const totalStores = setups.length;
  const operationalStores = setups.filter(s => s.status === 'operations_started').length;
  const inProgressStores = setups.filter(s => !['operations_started', 'cancelled'].includes(s.status)).length;
  const delayedStores = setups.filter(s => s.status === 'delayed' || s.delay_days > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Attributed Franchisee Store Setups
          </h1>
          <p className="text-xs text-slate-500">
            Real-time physical store execution status, checklist progress & operational readiness for your partner network.
          </p>
        </div>

        <button
          onClick={fetchSetups}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Attributed Stores</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalStores}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Total signed partners</span>
        </div>

        <div className="p-4.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Under Physical Setup</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{inProgressStores}</div>
          <span className="text-[11px] text-amber-500 mt-0.5 block">State team executing</span>
        </div>

        <div className="p-4.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Overdue / Delayed</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{delayedStores}</div>
          <span className="text-[11px] text-rose-500 mt-0.5 block">Requires attention</span>
        </div>

        <div className="p-4.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Live Operational</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{operationalStores}</div>
          <span className="text-[11px] text-emerald-500 mt-0.5 block">100% retail active</span>
        </div>
      </div>

      {/* Main Setups List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Partner Store Setup Pipeline</h3>
            <p className="text-xs text-slate-500">Live milestones tracked by regional field coordinators</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">
            {setups.length} Stores Tracked
          </span>
        </div>

        {setups.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Store className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            No store setups assigned to your account yet. Store setups trigger automatically when your franchisee leads sign their agreements and verify fee payment.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {setups.map((setup) => {
              const deadline = setup.revised_completion_date
                ? new Date(setup.revised_completion_date)
                : new Date(setup.original_completion_date);

              return (
                <div key={setup._id} className="p-6 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 font-mono text-xs font-bold rounded-lg">
                          {setup.store_setup_id}
                        </span>
                        <StatusBadge status={setup.status} delayDays={setup.delay_days} />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900">{setup.franchisee_name}</h4>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {setup.district_name ? `${setup.district_name}, ${setup.state_name}` : 'Regional'}
                        </span>
                        &bull;
                        <span>Plan: <strong>{setup.plan_name || 'Standard Franchise'}</strong></span>
                        &bull;
                        <span>Mobile: {setup.mobile}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedSetup(setup)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-start md:self-auto shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Milestone Status
                    </button>
                  </div>

                  {/* Progress Bar & Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Setup Progress</span>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1">
                        <div
                          className={`h-full rounded-full ${
                            setup.progress_percentage === 100
                              ? 'bg-emerald-500'
                              : setup.delay_days > 0
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${setup.progress_percentage || 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>{setup.completed_activities || 0}/{setup.total_activities || 16} completed</span>
                        <strong className="text-slate-800">{setup.progress_percentage || 0}%</strong>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Target Completion Date</span>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      {setup.delay_days > 0 ? (
                        <span className="text-rose-600 font-semibold text-[11px] mt-0.5 block">
                          Overdue by {setup.delay_days} days
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-[11px] mt-0.5 block">On target</span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Assigned State Coordinator</span>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        {setup.assigned_employee_name || 'Coordinator Unassigned'}
                      </div>
                      <span className="text-slate-400 text-[11px] mt-0.5 block">
                        {setup.assigned_employee_email || 'Pending state assignment'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Modal (View-Only) */}
      {selectedSetup && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-amber-600">{selectedSetup.store_setup_id}</span>
                <h3 className="text-lg font-black text-slate-900">{selectedSetup.franchisee_name}</h3>
              </div>
              <button
                onClick={() => setSelectedSetup(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <StatusBadge status={selectedSetup.status} delayDays={selectedSetup.delay_days} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Store Address:</span>
                <span className="font-semibold text-slate-800 text-right">{selectedSetup.store_address || selectedSetup.district_name || 'Regional'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Setup Start Date:</span>
                <span className="font-semibold text-slate-800">{new Date(selectedSetup.setup_start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Completion:</span>
                <span className="font-semibold text-slate-800">{new Date(selectedSetup.original_completion_date).toLocaleDateString()}</span>
              </div>
              {selectedSetup.revised_completion_date && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Approved Revised Date:</span>
                  <span className="font-bold text-amber-600">{new Date(selectedSetup.revised_completion_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-800 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>BDE Note:</strong> State coordinators are actively conducting on-site physical setup audits. Once all mandatory checklist items are verified and Admin grants final approval, this franchisee will automatically become 100% operational in your dashboard and goals achievement.
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedSetup(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, delayDays }) {
  const configs = {
    not_started: { label: 'Not Started', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
    employee_assigned: { label: 'Employee Assigned', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    in_progress: { label: 'In Progress', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    on_track: { label: 'On Track', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    due_soon: { label: 'Due Soon', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    delayed: { label: `Delayed (${delayDays || 0}d)`, bg: 'bg-red-50 text-red-700 border-red-200' },
    delay_approval_pending: { label: 'Extension Pending', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    delay_approved: { label: 'Extension Approved', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
    delay_rejected: { label: 'Extension Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    setup_completed: { label: 'Setup Completed', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    admin_verification_pending: { label: 'Verification Pending', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    correction_required: { label: 'Correction Required', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    admin_verified: { label: 'Admin Verified', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    operations_started: { label: 'Operations Live', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' },
    cancelled: { label: 'Cancelled', bg: 'bg-slate-100 text-slate-500 border-slate-200' },
  };

  const c = configs[status] || { label: status, bg: 'bg-slate-100 text-slate-600 border-slate-200' };

  return (
    <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${c.bg}`}>
      {c.label}
    </span>
  );
}
