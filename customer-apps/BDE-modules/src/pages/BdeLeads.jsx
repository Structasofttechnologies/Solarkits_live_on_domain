import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  RotateCw, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Sparkles, 
  LayoutGrid, 
  List, 
  Eye, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Send,
  MessageSquare,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';

export default function BdeLeads() {
  const [leads, setLeads] = useState([]);
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const [stageFilter, setStageFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadDetailLoading, setLeadDetailLoading] = useState(false);
  const [activityNote, setActivityNote] = useState('');
  const [activityType, setActivityType] = useState('call');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [stageReason, setStageReason] = useState('');
  const [targetStage, setTargetStage] = useState('');
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Lead Form State
  const [formData, setFormData] = useState({
    prospect_name: '',
    company_name: '',
    mobile_number: '',
    email: '',
    gst_number: '',
    state_name: 'Maharashtra',
    district_name: 'Pune',
    pincode: '',
    address_line: '',
    lead_source: 'direct_visit',
    bde_remarks: '',
    next_follow_up_date: '',
    outside_territory_reason: '',
  });

  const fetchLeadsAndPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const [resLeads, resPipe] = await Promise.all([
        api.get(`/leads/list?search=${encodeURIComponent(search)}&stage=${encodeURIComponent(stageFilter)}`),
        api.get('/pipeline'),
      ]);

      if (resLeads.data?.status === 'success') {
        setLeads(resLeads.data.data || []);
      }
      if (resPipe.data?.status === 'success') {
        setPipeline(resPipe.data.data);
      }
    } catch (err) {
      console.error('Failed to load leads pipeline', err);
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter]);

  useEffect(() => {
    fetchLeadsAndPipeline();
  }, [fetchLeadsAndPipeline]);

  const handleOpenLeadDetail = async (leadId) => {
    setLeadDetailLoading(true);
    try {
      const res = await api.get(`/leads/detail/${leadId}`);
      if (res.data?.status === 'success') {
        setSelectedLead(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load lead details');
    } finally {
      setLeadDetailLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/leads/create', formData);
      if (res.data?.status === 'success') {
        alert(`Lead ${res.data.data.lead_id} successfully created.`);
        setCreateModalOpen(false);
        setFormData({
          prospect_name: '',
          company_name: '',
          mobile_number: '',
          email: '',
          gst_number: '',
          state_name: 'Maharashtra',
          district_name: 'Pune',
          pincode: '',
          address_line: '',
          lead_source: 'direct_visit',
          bde_remarks: '',
          next_follow_up_date: '',
          outside_territory_reason: '',
        });
        fetchLeadsAndPipeline();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartSignup = async (leadId) => {
    if (!window.confirm('Initiate Franchisee Onboarding for this prospect? This will register an official partner record with permanent BDE attribution.')) {
      return;
    }
    try {
      const res = await api.post(`/leads/start-signup/${leadId}`);
      if (res.data?.status === 'success') {
        alert(res.data.message || 'Onboarding started!');
        fetchLeadsAndPipeline();
        if (selectedLead && selectedLead.lead._id === leadId) {
          handleOpenLeadDetail(leadId);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start signup');
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!activityNote.trim()) return;
    try {
      const res = await api.post(`/leads/activity/${selectedLead.lead._id}`, {
        activity_type: activityType,
        title: `${activityType.toUpperCase()} Log`,
        notes: activityNote.trim(),
        next_follow_up_date: nextFollowUpDate || null,
      });

      if (res.data?.status === 'success') {
        setActivityNote('');
        setNextFollowUpDate('');
        handleOpenLeadDetail(selectedLead.lead._id);
        fetchLeadsAndPipeline();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save note');
    }
  };

  const handleStageChangeSubmit = async (e) => {
    e.preventDefault();
    if (['lost', 'rejected'].includes(targetStage) && !stageReason.trim()) {
      alert('A specific reason is mandatory for marking lead as Lost or Rejected.');
      return;
    }

    try {
      const res = await api.put(`/leads/stage/${selectedLead.lead._id}`, {
        new_stage: targetStage,
        reason: stageReason,
      });

      if (res.data?.status === 'success') {
        setStageModalOpen(false);
        setStageReason('');
        handleOpenLeadDetail(selectedLead.lead._id);
        fetchLeadsAndPipeline();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update stage');
    }
  };

  const kanbanStages = [
    { id: 'new_lead', title: 'New Leads', color: 'border-blue-200 bg-blue-50/40 text-blue-800' },
    { id: 'contacted', title: 'Contacted', color: 'border-cyan-200 bg-cyan-50/40 text-cyan-800' },
    { id: 'interested', title: 'Qualified / Interested', color: 'border-teal-200 bg-teal-50/40 text-teal-800' },
    { id: 'signup_started', title: 'Signup In Progress', color: 'border-indigo-200 bg-indigo-50/40 text-indigo-800' },
    { id: 'approved', title: 'Admin Approved', color: 'border-emerald-200 bg-emerald-50/40 text-emerald-800' },
    { id: 'fee_paid', title: 'Fee Paid & Converted', color: 'border-emerald-300 bg-emerald-100/60 text-emerald-900' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Franchisee Leads Pipeline</h1>
          <p className="text-xs text-slate-500">
            Prospect, qualify, follow up, and initiate onboarding for solar franchisees in your territory.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Pipeline Board
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Franchisee Lead
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by prospect name, company, mobile, GST, or Lead ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Pipeline Stages</option>
            <option value="new_lead">New Lead</option>
            <option value="contacted">Contacted</option>
            <option value="follow_up_scheduled">Follow-up Scheduled</option>
            <option value="interested">Interested</option>
            <option value="signup_started">Signup Started</option>
            <option value="approved">Approved</option>
            <option value="agreement_signed">Agreement Signed</option>
            <option value="fee_paid">Fee Paid</option>
          </select>

          <button
            onClick={fetchLeadsAndPipeline}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold bg-slate-50/70">
                  <th className="py-3.5 px-4">Lead ID & Prospect</th>
                  <th className="py-3.5 px-4">Territory</th>
                  <th className="py-3.5 px-4">Follow-up Date</th>
                  <th className="py-3.5 px-4">Pipeline Stage</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <RotateCw className="w-6 h-6 text-amber-500 animate-spin mx-auto mb-2" />
                      Loading pipeline...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No prospect leads found. Click "Add Franchisee Lead" to capture a new prospect.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{lead.company_name}</div>
                        <div className="text-amber-600 font-mono text-[11px] font-bold mt-0.5">{lead.lead_id}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{lead.prospect_name} &bull; {lead.mobile_number}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-semibold text-slate-800">{lead.district_name}</div>
                        <div className="text-slate-400 text-[11px]">{lead.state_name}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {lead.next_follow_up_date ? (
                          <div className="text-slate-700 flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(lead.next_follow_up_date).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <LeadStageBadge stage={lead.lead_status} />
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        {lead.lead_status === 'new_lead' || lead.lead_status === 'contacted' || lead.lead_status === 'interested' ? (
                          <button
                            onClick={() => handleStartSignup(lead._id)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1 shadow-sm"
                          >
                            <UserCheck className="w-3 h-3" />
                            Start Signup
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleOpenLeadDetail(lead._id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1 shadow-sm"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KANBAN PIPELINE BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {kanbanStages.map((st) => {
            const items = pipeline?.grouped ? pipeline.grouped[st.id] || [] : [];
            return (
              <div key={st.id} className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200 space-y-3 min-w-[220px]">
                <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${st.color}`}>
                  <span>{st.title}</span>
                  <span className="bg-white/80 px-2 py-0.5 rounded-full text-[11px]">{items.length}</span>
                </div>

                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {items.map((lead) => (
                    <div
                      key={lead._id}
                      onClick={() => handleOpenLeadDetail(lead._id)}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-amber-400 cursor-pointer space-y-2 transition-all hover:translate-y-[-1px]"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-amber-600 font-bold block">{lead.lead_id}</span>
                        <h4 className="font-bold text-slate-900 text-xs leading-tight">{lead.company_name}</h4>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{lead.prospect_name}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>{lead.district_name}</span>
                        <span className="font-semibold text-slate-700">{lead.mobile_number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 1. Add Franchisee Lead Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Add New Franchisee Prospect Lead</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prospect Contact Person *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ramesh Patil"
                    value={formData.prospect_name}
                    onChange={(e) => setFormData({ ...formData, prospect_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Business Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Patil Solar Enterprises"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number (10 Digits) *</label>
                  <input
                    required
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. contact@patilsolar.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 27AABCU9603R1ZM"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={formData.lead_source}
                    onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="direct_visit">Direct Field Visit</option>
                    <option value="phone_call">Inbound / Outbound Call</option>
                    <option value="referral">Referral from Existing Partner</option>
                    <option value="trade_show">Trade Expo / Solar Summit</option>
                    <option value="digital">Digital Marketing Inquiry</option>
                    <option value="cold_outreach">Cold Outreach</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State *</label>
                  <input
                    required
                    type="text"
                    value={formData.state_name}
                    onChange={(e) => setFormData({ ...formData, state_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">District *</label>
                  <input
                    required
                    type="text"
                    value={formData.district_name}
                    onChange={(e) => setFormData({ ...formData, district_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial BDE Notes / Meeting Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Existing inverter dealer interested in exclusive SolarKits franchise..."
                  value={formData.bde_remarks}
                  onChange={(e) => setFormData({ ...formData, bde_remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Next Follow-up Date (Optional)</label>
                <input
                  type="date"
                  value={formData.next_follow_up_date}
                  onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
                >
                  {submitting ? 'Creating Lead...' : 'Register Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Lead Detail Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-amber-600">{selectedLead.lead.lead_id}</span>
                <h3 className="text-lg font-black text-slate-900">{selectedLead.lead.company_name}</h3>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage and Quick Actions Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block">Current Pipeline Stage</span>
                <LeadStageBadge stage={selectedLead.lead.lead_status} />
              </div>

              <div className="flex items-center gap-2">
                {!['signup_started', 'approved', 'agreement_signed', 'fee_paid'].includes(selectedLead.lead.lead_status) && (
                  <button
                    onClick={() => handleStartSignup(selectedLead.lead._id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Start Franchisee Signup
                  </button>
                )}

                <button
                  onClick={() => {
                    setTargetStage('contacted');
                    setStageReason('');
                    setStageModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
                >
                  Change Stage
                </button>
              </div>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[11px]">Prospect Contact</span>
                <strong className="text-slate-800">{selectedLead.lead.prospect_name} ({selectedLead.lead.mobile_number})</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Email & GST</span>
                <strong className="text-slate-800">{selectedLead.lead.email} &bull; {selectedLead.lead.gst_number || 'No GST'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Territory</span>
                <strong className="text-slate-800">{selectedLead.lead.district_name}, {selectedLead.lead.state_name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Plan Interest</span>
                <strong className="text-slate-800">{selectedLead.lead.interested_plan_name || 'Standard Franchisee'}</strong>
              </div>
            </div>

            {/* Add Call / Meeting Note Form */}
            <form onSubmit={handleAddActivity} className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                Log Interaction / Follow-up Note
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                >
                  <option value="call">Phone Call</option>
                  <option value="meeting">Physical Meeting</option>
                  <option value="site_visit">Shop Site Visit</option>
                  <option value="demo">Product Demo</option>
                  <option value="note">General Note</option>
                </select>

                <input
                  type="date"
                  placeholder="Next Follow-up Date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <textarea
                rows={2}
                placeholder="Details of call, discussion points, prospect feedback..."
                value={activityNote}
                onChange={(e) => setActivityNote(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-800 focus:outline-none"
              />

              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3 h-3" />
                Save Note & Schedule
              </button>
            </form>

            {/* Activity History Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase">Interaction Timeline ({selectedLead.activities?.length || 0})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedLead.activities?.map((act, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="font-bold text-slate-800">{act.title}</span>
                      <span>{new Date(act.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600">{act.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Stage Change Modal */}
      {stageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-slate-900">Update Lead Stage</h3>
            <form onSubmit={handleStageChangeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select New Stage</label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                >
                  <option value="contacted">Contacted</option>
                  <option value="follow_up_scheduled">Follow-up Scheduled</option>
                  <option value="interested">Qualified / Interested</option>
                  <option value="lost">Lost</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {['lost', 'rejected'].includes(targetStage) && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specific Reason (Mandatory) *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Budget constraints, opted for competitor, or unresponsive..."
                    value={stageReason}
                    onChange={(e) => setStageReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStageModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
                >
                  Save Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadStageBadge({ stage }) {
  const configs = {
    new_lead: { label: 'New Lead', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    contacted: { label: 'Contacted', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    follow_up_scheduled: { label: 'Follow-up Scheduled', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    interested: { label: 'Interested', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
    signup_started: { label: 'Signup In Progress', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    gst_verification_pending: { label: 'GST Pending', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    admin_review_pending: { label: 'Admin Review', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    approved: { label: 'Admin Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    agreement_signed: { label: 'Agreement Signed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    fee_paid: { label: 'Fee Paid (Converted)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' },
    rejected: { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    lost: { label: 'Lost', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
  };

  const c = configs[stage] || { label: stage, bg: 'bg-slate-100 text-slate-600 border-slate-200' };

  return (
    <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${c.bg}`}>
      {c.label}
    </span>
  );
}
