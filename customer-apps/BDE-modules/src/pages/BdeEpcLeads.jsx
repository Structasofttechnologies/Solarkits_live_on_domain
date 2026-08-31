import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ShieldCheck,
  Zap,
  Building2,
  Store,
  ChevronRight,
  Edit3,
  CalendarPlus,
  ArrowUpRight,
} from 'lucide-react';
import api from '../services/api';

const STAGES = [
  'New',
  'Contacted',
  'Interested',
  'Follow-up',
  'Onboarding Started',
  'GST Verification Pending',
  'Onboarded',
  'Assigned to Franchisee',
  'Not Interested',
  'Closed',
];

const LEAD_SOURCES = [
  { label: 'Direct Field Visit', value: 'direct_visit' },
  { label: 'Phone Call', value: 'phone_call' },
  { label: 'Referral', value: 'referral' },
  { label: 'Trade Show / Expo', value: 'trade_show' },
  { label: 'Digital / Social', value: 'digital' },
  { label: 'Cold Outreach', value: 'cold_outreach' },
  { label: 'Inbound Portal', value: 'portal' },
  { label: 'Head Office Assigned', value: 'head_office_assigned' },
];

const PRODUCT_TYPES = [
  'Residential On-Grid',
  'Commercial On-Grid',
  'Industrial Rooftop',
  'Solar Water Pump',
  'Off-Grid Hybrid Kit',
  'Solar Combo Kits',
];

function getStageBadge(stage) {
  const map = {
    New: 'bg-blue-50 text-blue-700 border-blue-200',
    Contacted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Interested: 'bg-amber-50 text-amber-700 border-amber-200',
    'Follow-up': 'bg-purple-50 text-purple-700 border-purple-200',
    'Onboarding Started': 'bg-teal-50 text-teal-700 border-teal-200',
    'GST Verification Pending': 'bg-amber-100 text-amber-900 border-amber-300',
    Onboarded: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Assigned to Franchisee': 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    'Not Interested': 'bg-slate-100 text-slate-600 border-slate-200',
    Closed: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return map[stage] || 'bg-slate-50 text-slate-600 border-slate-200';
}

export default function BdeEpcLeads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [stageCounts, setStageCounts] = useState({});
  const [territory, setTerritory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [detailLead, setDetailLead] = useState(null);
  const [followUpModalLead, setFollowUpModalLead] = useState(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    mobile_number: '',
    email: '',
    gst_number: '',
    state_name: 'Maharashtra',
    district_name: 'Pune',
    pincode: '',
    address_line: '',
    lead_source: 'direct_visit',
    interested_products: ['Residential On-Grid'],
    follow_up_date: '',
    remarks: '',
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/epc-leads/list', {
        params: {
          search,
          status: stageFilter,
          district: districtFilter,
          limit: 100,
        },
      });
      if (res.data?.status === 'success') {
        setLeads(res.data.data || []);
        setStageCounts(res.data.stage_counts || {});
        setTerritory(res.data.territory || null);
        if (res.data.territory?.state_name) {
          setFormData((prev) => ({
            ...prev,
            state_name: res.data.territory.state_name,
            district_name: res.data.territory.district_names?.[0] || prev.district_name,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load EPC leads', err);
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter, districtFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleOpenCreateModal = () => {
    setEditLead(null);
    setFormData({
      company_name: '',
      contact_person: '',
      mobile_number: '',
      email: '',
      gst_number: '',
      state_name: territory?.state_name || 'Maharashtra',
      district_name: territory?.district_names?.[0] || 'Pune',
      pincode: '',
      address_line: '',
      lead_source: 'direct_visit',
      interested_products: ['Residential On-Grid'],
      follow_up_date: '',
      remarks: '',
    });
    setCreateModalOpen(true);
  };

  const handleOpenEditModal = (lead) => {
    setEditLead(lead);
    setFormData({
      company_name: lead.company_name,
      contact_person: lead.contact_person,
      mobile_number: lead.mobile_number,
      email: lead.email,
      gst_number: lead.gst_number || '',
      state_name: lead.state_name,
      district_name: lead.district_name,
      pincode: lead.pincode || '',
      address_line: lead.address_line || '',
      lead_source: lead.lead_source || 'direct_visit',
      interested_products: lead.interested_products || ['Residential On-Grid'],
      follow_up_date: lead.follow_up_date ? lead.follow_up_date.split('T')[0] : '',
      remarks: lead.remarks || '',
    });
    setCreateModalOpen(true);
  };

  const handleSubmitLeadForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editLead) {
        const res = await api.put(`/epc-leads/update/${editLead._id}`, formData);
        if (res.data?.status === 'success') {
          alert('EPC Lead updated successfully!');
          setCreateModalOpen(false);
          fetchLeads();
        }
      } else {
        const res = await api.post('/epc-leads/create', formData);
        if (res.data?.status === 'success') {
          alert(`EPC Lead ${res.data.data.lead_id} created successfully!`);
          setCreateModalOpen(false);
          fetchLeads();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpDate) {
      alert('Please select a follow up date');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/epc-leads/follow-up/${followUpModalLead._id}`, {
        follow_up_date: followUpDate,
        notes: followUpNotes,
      });
      if (res.data?.status === 'success') {
        alert('Follow-up scheduled successfully!');
        setFollowUpModalLead(null);
        setFollowUpDate('');
        setFollowUpNotes('');
        fetchLeads();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartOnboarding = (lead) => {
    // Navigate to GST Onboarding Wizard with lead info passed in state
    navigate('/epc-onboarding', { state: { lead } });
  };

  const handleToggleProduct = (product) => {
    setFormData((prev) => {
      const exists = prev.interested_products.includes(product);
      return {
        ...prev,
        interested_products: exists
          ? prev.interested_products.filter((p) => p !== product)
          : [...prev.interested_products, product],
      };
    });
  };

  const totalLeadsCount = leads.length;
  const onboardedCount = stageCounts['Onboarded'] || 0;
  const assignedCount = stageCounts['Assigned to Franchisee'] || 0;
  const followUpCount = stageCounts['Follow-up'] || 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full uppercase">
              EPC Pipeline
            </span>
            {territory?.state_name && (
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> {territory.state_name}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">
            EPC Leads & Prospect Management
          </h1>
          <p className="text-xs text-slate-500">
            Generate EPC contractor leads, track 10-stage follow-ups, and initiate GST-based onboarding.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchLeads}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh Leads"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/epc-onboarding')}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> GST Onboarding Wizard
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add EPC Lead
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total EPC Leads</span>
          <div className="text-2xl font-black text-slate-900">{totalLeadsCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">In your territory</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-purple-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Follow-ups Due</span>
          <div className="text-2xl font-black text-purple-700">{followUpCount}</div>
          <span className="text-[10px] text-purple-600 font-medium">Scheduled contacts</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-teal-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">GST Onboarded</span>
          <div className="text-2xl font-black text-teal-700">{onboardedCount}</div>
          <span className="text-[10px] text-teal-600 font-medium">Verified accounts</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Assigned to Franchisee</span>
          <div className="text-2xl font-black text-emerald-700">{assignedCount}</div>
          <span className="text-[10px] text-emerald-600 font-medium">Active partners</span>
        </div>
      </div>

      {/* Filter & View Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search EPC leads by company name, contact, mobile, email, or GSTIN..."
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none placeholder-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* District Filter */}
            {territory?.district_names && territory.district_names.length > 0 && (
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Districts</option>
                {territory.district_names.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'table' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'kanban' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Kanban Pipeline"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 10-Stage Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStageFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold shrink-0 transition ${
              stageFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Leads ({totalLeadsCount})
          </button>
          {STAGES.map((st) => (
            <button
              key={st}
              onClick={() => setStageFilter(st)}
              className={`px-3 py-1 rounded-lg font-bold shrink-0 transition flex items-center gap-1.5 ${
                stageFilter === st ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{st}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${stageFilter === st ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {stageCounts[st] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <RotateCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading EPC leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No EPC Leads Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {stageFilter !== 'all' || search
              ? 'No EPC leads match your active filters.'
              : 'You haven\'t added any EPC contractor leads yet. Click "Add EPC Lead" to get started.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
          >
            Add New EPC Lead
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Lead ID / EPC Company</th>
                  <th className="px-4 py-3.5">Contact Person</th>
                  <th className="px-4 py-3.5">District / Territory</th>
                  <th className="px-4 py-3.5">GST Details</th>
                  <th className="px-4 py-3.5">Lead Status</th>
                  <th className="px-4 py-3.5">Assigned Franchisee</th>
                  <th className="px-4 py-3.5">Follow-up Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-[11px] text-blue-600 font-bold">{lead.lead_id}</div>
                      <div className="font-bold text-slate-900 text-sm mt-0.5">{lead.company_name}</div>
                      {lead.interested_products?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lead.interested_products.slice(0, 2).map((p, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-semibold">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{lead.contact_person}</div>
                      <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" /> {lead.mobile_number}
                      </div>
                      <div className="text-slate-400 text-[11px] truncate max-w-[150px]">{lead.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{lead.district_name}</div>
                      <div className="text-slate-500 text-[11px]">{lead.state_name}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      {lead.gst_number ? (
                        <div>
                          <div className="font-mono font-bold text-slate-700 text-[11px]">{lead.gst_number}</div>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 ${
                              lead.gst_verified
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {lead.gst_verified ? 'Verified' : 'Pending Verification'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No GST entered</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-block ${getStageBadge(lead.lead_status)}`}>
                        {lead.lead_status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {lead.assigned_franchisee_id ? (
                        <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{lead.assigned_franchisee_id.business_name || lead.assigned_franchisee_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {lead.follow_up_date ? (
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-purple-500" />
                          <span>{new Date(lead.follow_up_date).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.lead_status !== 'Onboarded' && lead.lead_status !== 'Assigned to Franchisee' && (
                          <button
                            onClick={() => handleStartOnboarding(lead)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] transition flex items-center gap-1"
                            title="Start GST Onboarding"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Onboard
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setFollowUpModalLead(lead);
                            setFollowUpDate(lead.follow_up_date ? lead.follow_up_date.split('T')[0] : '');
                            setFollowUpNotes('');
                          }}
                          className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition"
                          title="Schedule Follow-up"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(lead)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                          title="Edit Lead"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDetailLead(lead)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                          title="View Details & History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {STAGES.slice(0, 5).map((stage) => {
            const stageLeads = leads.filter((l) => l.lead_status === stage);
            return (
              <div key={stage} className="bg-slate-100/80 p-3 rounded-2xl border border-slate-200 min-w-[260px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{stage}</span>
                  <span className="px-2 py-0.5 bg-white text-slate-700 font-black rounded-full text-[10px] shadow-xs">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {stageLeads.map((l) => (
                    <div key={l._id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-blue-600 font-bold">{l.lead_id}</span>
                        <span className="text-[10px] font-semibold text-slate-400">{l.district_name}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{l.company_name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Contact: {l.contact_person}</p>
                      {l.gst_number && (
                        <div className="text-[10px] font-mono bg-slate-50 p-1 rounded border border-slate-100 text-slate-600 truncate">
                          GST: {l.gst_number}
                        </div>
                      )}
                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => setDetailLead(l)}
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleStartOnboarding(l)}
                          className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700"
                        >
                          Onboard
                        </button>
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs italic">No leads in this stage</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Add / Edit EPC Lead */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editLead ? 'Edit EPC Lead' : 'Add New EPC Lead'}
                </h3>
                <p className="text-xs text-slate-500">Capture contractor prospects and project requirements</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeadForm} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">EPC Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="e.g. Apex Solar Tech Pvt Ltd"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. contact@apexsolar.in"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={formData.lead_source}
                    onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state_name}
                    onChange={(e) => setFormData({ ...formData, state_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">District *</label>
                  {territory?.district_names && territory.district_names.length > 0 ? (
                    <select
                      value={formData.district_name}
                      onChange={(e) => setFormData({ ...formData, district_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      {territory.district_names.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={formData.district_name}
                      onChange={(e) => setFormData({ ...formData, district_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="e.g. 411001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Interested Product / Project Types</label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_TYPES.map((p) => {
                    const isSelected = formData.interested_products.includes(p);
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => handleToggleProduct(p)}
                        className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks & Requirements</label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Notes from initial conversation..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editLead ? 'Update Lead' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Schedule Follow-up */}
      {followUpModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Schedule Follow-up</h3>
                <p className="text-xs text-slate-500">{followUpModalLead.company_name}</p>
              </div>
              <button
                onClick={() => setFollowUpModalLead(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleFollowUp} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Follow-up Date *</label>
                <input
                  type="date"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Follow-up Notes / Agenda</label>
                <textarea
                  rows={3}
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="e.g. Call regarding 2.2kW combo kit quotation..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFollowUpModalLead(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: Lead Details & Activity History */}
      {detailLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden animate-slideLeft">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="font-mono text-xs text-blue-600 font-bold">{detailLead.lead_id}</span>
                <h3 className="text-base font-black text-slate-900">{detailLead.company_name}</h3>
              </div>
              <button
                onClick={() => setDetailLead(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Status & Actions */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase">Current Stage</span>
                  <div className="mt-0.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border inline-block ${getStageBadge(detailLead.lead_status)}`}>
                      {detailLead.lead_status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleStartOnboarding(detailLead)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Start Onboarding
                </button>
              </div>

              {/* Lead Info */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-slate-400">
                  Lead Information
                </h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contact Person:</span>
                    <span className="font-semibold text-slate-900">{detailLead.contact_person}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mobile:</span>
                    <span className="font-mono font-semibold text-slate-900">{detailLead.mobile_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-semibold text-slate-900">{detailLead.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">GST Number:</span>
                    <span className="font-mono font-bold text-slate-900">{detailLead.gst_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Territory:</span>
                    <span className="font-semibold text-slate-900">
                      {detailLead.district_name}, {detailLead.state_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lead Source:</span>
                    <span className="capitalize font-semibold text-slate-900">{detailLead.lead_source?.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              {/* Activity History Timeline */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-slate-400">
                  Activity Timeline & Notes
                </h4>
                <div className="space-y-3 pl-2 border-l-2 border-slate-100">
                  {detailLead.history && detailLead.history.length > 0 ? (
                    detailLead.history.map((act, i) => (
                      <div key={i} className="relative pl-4 space-y-1">
                        <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                          <span>{act.actor_name || 'BDE Executive'}</span>
                          <span>{new Date(act.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                          {act.notes}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic">No activity entries recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
