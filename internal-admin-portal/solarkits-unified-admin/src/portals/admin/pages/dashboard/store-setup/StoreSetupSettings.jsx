import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Save, 
  Plus, 
  Trash2, 
  Check, 
  RotateCw,
  CheckCircle2,
  FileCheck,
  Clock,
  X
} from 'lucide-react';
import { storeSetupApi } from '../../../api/storeSetupApi';

export default function StoreSetupSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New activity form modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activity_code: '',
    title: '',
    description: '',
    category: 'Location and Documentation',
    is_mandatory: true,
    proof_required: true,
    display_order: 1,
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await storeSetupApi.getSettings();
      if (res?.status === 'success') {
        setSettings(res.data);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await storeSetupApi.updateSettings(settings);
      if (res?.status === 'success') {
        alert('Store Setup settings saved successfully!');
        setSettings(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMandatory = (index) => {
    const list = [...(settings.master_checklist_activities || [])];
    list[index].is_mandatory = !list[index].is_mandatory;
    setSettings({ ...settings, master_checklist_activities: list });
  };

  const handleToggleProof = (index) => {
    const list = [...(settings.master_checklist_activities || [])];
    list[index].proof_required = !list[index].proof_required;
    setSettings({ ...settings, master_checklist_activities: list });
  };

  const handleDeleteActivity = (index) => {
    if (!window.confirm('Remove this activity from the master template? Existing store setup snapshots will not be modified.')) return;
    const list = [...(settings.master_checklist_activities || [])];
    list.splice(index, 1);
    setSettings({ ...settings, master_checklist_activities: list });
  };

  const handleAddActivitySubmit = (e) => {
    e.preventDefault();
    const list = [...(settings.master_checklist_activities || [])];
    const code = newActivity.activity_code || `ACT_CUSTOM_${list.length + 1}`;
    list.push({ ...newActivity, activity_code: code, display_order: list.length + 1 });
    setSettings({ ...settings, master_checklist_activities: list });
    setNewModalOpen(false);
    setNewActivity({
      activity_code: '',
      title: '',
      description: '',
      category: 'Location and Documentation',
      is_mandatory: true,
      proof_required: true,
      display_order: list.length + 2,
    });
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RotateCw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  const activities = settings.master_checklist_activities || [];

  return (
    <div className="space-y-6">
      {/* Top Save & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-600" />
            Store Setup SLA & Master Checklist Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure platform setup duration deadlines, delay approval workflows, and mandatory physical inspection criteria
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Global SLAs & Policies Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Default Setup Timeline SLAs</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Standard Allowed Setup Duration (Days)
            </label>
            <input
              type="number"
              min={1}
              value={settings.default_setup_days}
              onChange={(e) => setSettings({ ...settings, default_setup_days: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500 font-semibold"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default number of days allocated to complete retail store setup.</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Maximum Delay Allowed per Request (Days)
            </label>
            <input
              type="number"
              min={1}
              value={settings.max_delay_days_allowed}
              onChange={(e) => setSettings({ ...settings, max_delay_days_allowed: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500 font-semibold"
            />
            <p className="text-[11px] text-slate-400 mt-1">Max timeline extension a state coordinator can request per cycle.</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Delay Approval Workflow
            </label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="reqApproval"
                checked={settings.require_delay_approval}
                onChange={(e) => setSettings({ ...settings, require_delay_approval: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="reqApproval" className="text-xs text-slate-700 font-medium cursor-pointer">
                Require Admin Approval for Timeline Extensions
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">When checked, extensions won't shift SLA until Admin approves.</p>
          </div>
        </div>
      </div>

      {/* Master Checklist Activities Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Master 16-Step Physical Setup Checklist Template ({activities.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Activities automatically snapshotted to new store setup records upon agreement signing
            </p>
          </div>

          <button
            onClick={() => setNewModalOpen(true)}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Master Activity
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold bg-slate-50/80">
                <th className="py-3 px-4">Order & Code</th>
                <th className="py-3 px-4">Title & Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Mandatory</th>
                <th className="py-3 px-4 text-center">Proof Required</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map((act, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-amber-600 font-bold">
                    #{idx + 1} &bull; {act.activity_code}
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-bold text-slate-900">{act.title}</div>
                    <div className="text-slate-500 text-[11px] truncate">{act.description}</div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700">
                    <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700">
                      {act.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleMandatory(idx)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
                        act.is_mandatory
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {act.is_mandatory ? 'YES' : 'NO'}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleProof(idx)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
                        act.proof_required
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {act.proof_required ? 'PHOTO/DOC' : 'NONE'}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteActivity(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Master Activity Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Master Checklist Activity</h3>
              <button onClick={() => setNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddActivitySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Activity Code (Unique ID)</label>
                <input
                  type="text"
                  placeholder="e.g. ACT_INSPECT_INVERTER"
                  value={newActivity.activity_code}
                  onChange={(e) => setNewActivity({ ...newActivity, activity_code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Activity Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Inverter Demo Unit Setup"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={newActivity.category}
                  onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500"
                >
                  <option value="Location and Documentation">Location and Documentation</option>
                  <option value="Store Infrastructure">Store Infrastructure</option>
                  <option value="Solarkits Branding">Solarkits Branding</option>
                  <option value="Product Display">Product Display</option>
                  <option value="Software Setup">Software Setup</option>
                  <option value="Final Verification">Final Verification</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Instructions</label>
                <textarea
                  rows={2}
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newActivity.is_mandatory}
                    onChange={(e) => setNewActivity({ ...newActivity, is_mandatory: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700">Mandatory Activity</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newActivity.proof_required}
                    onChange={(e) => setNewActivity({ ...newActivity, proof_required: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700">Photo Proof Required</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Add to Master List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
