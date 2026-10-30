import React, { useState, useEffect } from 'react';
import {
  FaMapMarkedAlt,
  FaTimes,
  FaCheck,
  FaExclamationCircle,
  FaSpinner,
  FaTrash,
  FaEdit,
  FaPlus,
  FaLayerGroup,
  FaSearch,
  FaCalendarAlt,
} from 'react-icons/fa';
import { bdeApi } from '../../../api/bdeApi';

export default function TerritoryModal({
  isOpen,
  onClose,
  bde,
  existingTerritory = null,
  onSuccess,
}) {
  const [states, setStates] = useState([]);
  const [activeTerritories, setActiveTerritories] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Assignment Form Mode: 'single' | 'batch'
  const [assignMode, setAssignMode] = useState('single');

  // Single State Form State
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedStateName, setSelectedStateName] = useState('');
  const [districts, setDistricts] = useState([]);
  const [selectedDistrictIds, setSelectedDistrictIds] = useState([]);
  const [districtSearch, setDistrictSearch] = useState('');
  const [priority, setPriority] = useState('medium');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);

  // Batch Multi-State Form State
  const [batchSelectedStateIds, setBatchSelectedStateIds] = useState([]);
  const [batchPriority, setBatchPriority] = useState('medium');
  const [batchStartDate, setBatchStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchEndDate, setBatchEndDate] = useState('');
  const [batchNotes, setBatchNotes] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [fetchingDistricts, setFetchingDistricts] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const bdeId = bde?._id || bde?.id;

  useEffect(() => {
    if (isOpen && bdeId) {
      setError(null);
      setSuccessMsg(null);
      resetSingleForm();
      setBatchSelectedStateIds([]);
      loadInitialData();
    }
  }, [isOpen, bdeId]);

  // When existingTerritory is passed from outside (e.g. BdeProfile.jsx), enter edit mode
  useEffect(() => {
    if (isOpen && existingTerritory) {
      applyTerritoryToEdit(existingTerritory);
    }
  }, [isOpen, existingTerritory]);

  const loadInitialData = async () => {
    setLoadingInitial(true);
    try {
      const [statesRes, terrRes] = await Promise.all([
        bdeApi.getStates(),
        bdeApi.getTerritory(bdeId),
      ]);
      const stateList = statesRes.states || statesRes.data || [];
      setStates(stateList);

      const activeList = terrRes.data?.active || [];
      setActiveTerritories(activeList);
    } catch (err) {
      console.error('Failed to load territory initial data', err);
      setError('Could not load states or current territory data. Please try again.');
    } finally {
      setLoadingInitial(false);
    }
  };

  const refreshActiveTerritories = async () => {
    try {
      const terrRes = await bdeApi.getTerritory(bdeId);
      const activeList = terrRes.data?.active || [];
      setActiveTerritories(activeList);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to refresh active territories', err);
    }
  };

  const resetSingleForm = () => {
    setSelectedStateId('');
    setSelectedStateName('');
    setDistricts([]);
    setSelectedDistrictIds([]);
    setDistrictSearch('');
    setPriority('medium');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setNotes('');
    setEditingAssignmentId(null);
  };

  const applyTerritoryToEdit = (t) => {
    setAssignMode('single');
    const sId = (t.state_id?._id || t.state_id || '').toString();
    setSelectedStateId(sId);
    setSelectedStateName(t.state_name || '');
    setPriority(t.priority || 'medium');
    setStartDate(t.assignment_start_date ? t.assignment_start_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEndDate(t.assignment_end_date ? t.assignment_end_date.split('T')[0] : '');
    setNotes(t.notes || '');
    setEditingAssignmentId(t._id || t.id);
    setError(null);
    setSuccessMsg(null);

    if (sId) {
      fetchDistrictsForState(sId, t.district_ids, t.district_names);
    }
  };

  const fetchDistrictsForState = async (stateId, preselectedIds = [], preselectedNames = []) => {
    setFetchingDistricts(true);
    try {
      const res = await bdeApi.getDistricts(stateId);
      const districtList = res.districts || res.data || [];
      setDistricts(districtList);

      const strIds = (preselectedIds || []).map(id => (id._id || id).toString());
      const strNames = preselectedNames || [];

      if (strIds.length > 0 || strNames.length > 0) {
        const matchingIds = districtList
          .filter(d => {
            const dId = (d._id || d.id || '').toString();
            return strIds.includes(dId) || strNames.includes(d.name);
          })
          .map(d => d._id || d.id);
        setSelectedDistrictIds(matchingIds);
      } else {
        setSelectedDistrictIds([]);
      }
    } catch (err) {
      console.error('Failed to fetch districts', err);
    } finally {
      setFetchingDistricts(false);
    }
  };

  const handleStateChange = (e) => {
    const sId = e.target.value;
    setSelectedStateId(sId);
    setEditingAssignmentId(null);
    const selectedStateObj = states.find(s => (s._id || s.id) === sId);
    setSelectedStateName(selectedStateObj ? selectedStateObj.name : '');

    // Check if this state is already assigned to this BDE
    const already = activeTerritories.find(
      t => (t.state_id?._id || t.state_id || '').toString() === sId.toString()
    );

    if (sId) {
      if (already) {
        // Pre-populate with existing state data
        applyTerritoryToEdit(already);
      } else {
        fetchDistrictsForState(sId);
      }
    } else {
      setDistricts([]);
      setSelectedDistrictIds([]);
    }
  };

  const toggleDistrict = (dId) => {
    setSelectedDistrictIds(prev =>
      prev.includes(dId) ? prev.filter(id => id !== dId) : [...prev, dId]
    );
  };

  const selectAllDistricts = () => {
    if (selectedDistrictIds.length === districts.length) {
      setSelectedDistrictIds([]);
    } else {
      setSelectedDistrictIds(districts.map(d => d._id || d.id));
    }
  };

  // Submit Single State Assignment
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (!selectedStateId) {
        setError('Please select a State.');
        setLoading(false);
        return;
      }

      const districtNames = districts
        .filter(d => selectedDistrictIds.includes(d._id || d.id))
        .map(d => d.name);

      await bdeApi.assignTerritory({
        bde_id: bdeId,
        country_name: 'India',
        state_id: selectedStateId,
        state_name: selectedStateName,
        district_ids: selectedDistrictIds,
        district_names: districtNames,
        assignment_start_date: startDate,
        assignment_end_date: endDate || null,
        priority,
        notes,
      });

      setSuccessMsg(`State "${selectedStateName}" assigned successfully with ${selectedDistrictIds.length} district(s)!`);
      await refreshActiveTerritories();
      resetSingleForm();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to assign territory');
    } finally {
      setLoading(false);
    }
  };

  // Submit Batch Multi-State Assignment
  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (batchSelectedStateIds.length === 0) {
      setError('Please select at least one state to assign.');
      return;
    }

    setLoading(true);
    try {
      const statesPayload = batchSelectedStateIds.map(sId => {
        const stateObj = states.find(s => (s._id || s.id) === sId);
        return {
          state_id: sId,
          state_name: stateObj ? stateObj.name : 'Assigned State',
          all_districts: true,
          district_ids: [],
          district_names: [],
          assignment_start_date: batchStartDate,
          assignment_end_date: batchEndDate || null,
          priority: batchPriority,
          notes: batchNotes || null,
        };
      });

      await bdeApi.assignTerritory({
        bde_id: bdeId,
        states: statesPayload,
      });

      setSuccessMsg(`Successfully assigned ${statesPayload.length} state(s) with all active districts!`);
      setBatchSelectedStateIds([]);
      await refreshActiveTerritories();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to batch assign states');
    } finally {
      setLoading(false);
    }
  };

  // Remove State Assignment
  const handleRemoveState = async (assignmentId, stateName) => {
    if (!window.confirm(`Are you sure you want to remove state "${stateName}" from this BDE?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await bdeApi.removeTerritory(bdeId, assignmentId);
      setSuccessMsg(`State "${stateName}" was removed successfully.`);
      if (editingAssignmentId === assignmentId) {
        resetSingleForm();
      }
      await refreshActiveTerritories();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to remove territory');
    } finally {
      setLoading(false);
    }
  };

  const toggleBatchState = (sId) => {
    setBatchSelectedStateIds(prev =>
      prev.includes(sId) ? prev.filter(id => id !== sId) : [...prev, sId]
    );
  };

  const selectAllBatchStates = () => {
    if (batchSelectedStateIds.length === states.length) {
      setBatchSelectedStateIds([]);
    } else {
      setBatchSelectedStateIds(states.map(s => s._id || s.id));
    }
  };

  if (!isOpen || !bde) return null;

  const assignedStateIds = activeTerritories.map(
    t => (t.state_id?._id || t.state_id || '').toString()
  );

  const filteredDistricts = districts.filter(d =>
    d.name?.toLowerCase().includes(districtSearch.toLowerCase())
  );

  const totalAssignedDistricts = activeTerritories.reduce(
    (sum, t) => sum + (t.district_names?.length || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-slate-50 to-white">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-100 text-[#0575B8] rounded-2xl shadow-xs">
              <FaMapMarkedAlt className="text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Manage Territory & State Jurisdictions
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0575B8]/10 text-[#0575B8] border border-blue-200 uppercase">
                  Multi-State Enabled
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Assign and manage multiple authorized states and district quotas for{' '}
                <span className="font-bold text-slate-900">{bde.full_name}</span> ({bde.bde_id})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 md:p-6 space-y-6 flex-1 text-xs">
          {/* Notifications */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center justify-between gap-2 font-semibold">
              <div className="flex items-center gap-2">
                <FaExclamationCircle className="text-rose-600 shrink-0 text-sm" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                <FaTimes />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between gap-2 font-semibold">
              <div className="flex items-center gap-2">
                <FaCheck className="text-emerald-600 shrink-0 text-sm" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
                <FaTimes />
              </button>
            </div>
          )}

          {/* Section 1: Active Assigned States Overview */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <FaLayerGroup className="text-[#0575B8]" />
                  Active Assigned States ({activeTerritories.length})
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  States and districts where {bde.full_name} is currently authorized to operate.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 shadow-2xs">
                  Total Districts: <strong className="text-indigo-700">{totalAssignedDistricts}</strong>
                </span>
                {editingAssignmentId && (
                  <button
                    type="button"
                    onClick={resetSingleForm}
                    className="px-3 py-1 bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl text-[11px] font-bold transition cursor-pointer"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
            </div>

            {loadingInitial ? (
              <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2">
                <FaSpinner className="animate-spin text-[#0575B8]" /> Loading current state assignments...
              </div>
            ) : activeTerritories.length === 0 ? (
              <div className="py-6 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 font-medium">
                No state territory currently assigned to this BDE. Use the form below to assign the first state!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {activeTerritories.map((t) => {
                  const tId = t._id || t.id;
                  const isBeingEdited = editingAssignmentId === tId;
                  const districtCount = t.district_names?.length || 0;

                  return (
                    <div
                      key={tId}
                      className={`p-3.5 rounded-xl border transition-all ${isBeingEdited
                          ? 'bg-blue-50/80 border-[#0575B8] shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{t.state_name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${t.priority === 'primary' || t.priority === 'high'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}>
                              {t.priority || 'medium'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0575B8] border border-blue-200">
                              {districtCount} Districts
                            </span>
                          </div>
                          {t.notes && (
                            <p className="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-xs">{t.notes}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            title="Edit districts for this state"
                            onClick={() => applyTerritoryToEdit(t)}
                            className="p-1.5 text-slate-500 hover:text-[#0575B8] hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          >
                            <FaEdit size={13} />
                          </button>
                          <button
                            type="button"
                            title="Remove this state from BDE"
                            onClick={() => handleRemoveState(tId, t.state_name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Districts Pill List */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        {districtCount > 0 ? (
                          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
                            {t.district_names.map((d, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-semibold"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">All districts authorized</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Assign State Tabs & Form */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
            {/* Mode Switch Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {editingAssignmentId
                    ? `Editing Assigned State: ${selectedStateName}`
                    : '+ Assign New State Territory'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {editingAssignmentId
                    ? 'Modify assigned districts, priority, or dates for this state.'
                    : 'Select a state and assign specific district quotas or batch assign multiple states.'}
                </p>
              </div>

              {!editingAssignmentId && (
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAssignMode('single')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${assignMode === 'single'
                        ? 'bg-white text-[#0575B8] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Single State & Districts
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignMode('batch')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${assignMode === 'batch'
                        ? 'bg-white text-[#0575B8] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Quick Multi-State (All Districts)
                  </button>
                </div>
              )}
            </div>

            {/* TAB 1: Single State & Districts Custom Assign */}
            {assignMode === 'single' && (
              <form onSubmit={handleSingleSubmit} className="space-y-4">
                {/* State Dropdown */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                      Select State *
                    </label>
                    {editingAssignmentId && (
                      <span className="text-[11px] text-[#0575B8] font-bold">
                        Editing State: {selectedStateName}
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedStateId}
                    onChange={handleStateChange}
                    required
                    disabled={Boolean(editingAssignmentId)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white transition cursor-pointer disabled:opacity-60"
                  >
                    <option value="">-- Choose State --</option>
                    {states.map(s => {
                      const sId = (s._id || s.id).toString();
                      const isAssigned = assignedStateIds.includes(sId);
                      return (
                        <option key={sId} value={sId}>
                          {s.name} {isAssigned ? '✓ (Currently Assigned)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Districts Multi-Select with Search & Select All */}
                {selectedStateId && (
                  <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                          Districts for {selectedStateName}
                        </label>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#0575B8] font-bold text-[10px]">
                          {selectedDistrictIds.length} of {districts.length} selected
                        </span>
                      </div>

                      {districts.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={selectAllDistricts}
                            className="text-xs text-[#0575B8] font-bold hover:underline cursor-pointer"
                          >
                            {selectedDistrictIds.length === districts.length ? 'Deselect All' : 'Select All Districts'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* District Search filter */}
                    {districts.length > 6 && (
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-slate-400 text-xs" />
                        <input
                          type="text"
                          value={districtSearch}
                          onChange={(e) => setDistrictSearch(e.target.value)}
                          placeholder={`Filter ${districts.length} districts in ${selectedStateName}...`}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0575B8]"
                        />
                      </div>
                    )}

                    {fetchingDistricts ? (
                      <div className="text-xs text-slate-500 py-6 text-center bg-white rounded-xl border border-slate-200 flex items-center justify-center gap-2 font-medium">
                        <FaSpinner className="animate-spin text-[#0575B8]" /> Loading districts for {selectedStateName}...
                      </div>
                    ) : districts.length === 0 ? (
                      <div className="text-xs text-amber-800 py-4 text-center bg-amber-50 rounded-xl border border-amber-200 font-medium">
                        No active districts found for this state in Location Settings.
                      </div>
                    ) : filteredDistricts.length === 0 ? (
                      <div className="text-xs text-slate-400 py-4 text-center bg-white rounded-xl border border-slate-200">
                        No districts match "{districtSearch}".
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                        {filteredDistricts.map(d => {
                          const dId = d._id || d.id;
                          const isSelected = selectedDistrictIds.includes(dId);
                          return (
                            <button
                              type="button"
                              key={dId}
                              onClick={() => toggleDistrict(dId)}
                              className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${isSelected
                                  ? 'bg-blue-50 text-[#0575B8] border-2 border-[#0575B8] shadow-2xs'
                                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                              <span className="truncate">{d.name}</span>
                              {isSelected && <FaCheck className="text-[10px] shrink-0 ml-1 text-[#0575B8]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Priority & Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white transition cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="primary">Primary</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Assignment Notes */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                    Assignment Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Authorized to oversee channel partners and solar kit distribution."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-[#0575B8] focus:bg-white transition"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {editingAssignmentId && (
                    <button
                      type="button"
                      onClick={resetSingleForm}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading || !selectedStateId}
                    className="px-6 py-2.5 bg-[#0575B8] hover:bg-[#045D93] text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" /> Saving State...
                      </>
                    ) : editingAssignmentId ? (
                      <>
                        <FaCheck /> Update State Assignment
                      </>
                    ) : (
                      <>
                        <FaPlus /> Save State Territory
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Quick Multi-State Batch Assign (All Districts) */}
            {assignMode === 'batch' && (
              <form onSubmit={handleBatchSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                        Select Multiple States ({batchSelectedStateIds.length} of {states.length} selected)
                      </label>
                      <p className="text-[11px] text-slate-500 font-medium">
                        All active districts of selected states will be assigned to this BDE.
                      </p>
                    </div>
                    {states.length > 0 && (
                      <button
                        type="button"
                        onClick={selectAllBatchStates}
                        className="text-xs text-[#0575B8] font-bold hover:underline cursor-pointer"
                      >
                        {batchSelectedStateIds.length === states.length ? 'Deselect All' : 'Select All States'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    {states.map(s => {
                      const sId = (s._id || s.id).toString();
                      const isChecked = batchSelectedStateIds.includes(sId);
                      const isAlreadyAssigned = assignedStateIds.includes(sId);

                      return (
                        <button
                          type="button"
                          key={sId}
                          onClick={() => toggleBatchState(sId)}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${isChecked
                              ? 'bg-blue-50 text-[#0575B8] border-2 border-[#0575B8] shadow-xs'
                              : isAlreadyAssigned
                                ? 'bg-emerald-50/50 text-emerald-900 border border-emerald-200'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                          <span className="truncate">{s.name}</span>
                          {isChecked ? (
                            <FaCheck className="text-[11px] shrink-0 ml-1 text-[#0575B8]" />
                          ) : isAlreadyAssigned ? (
                            <span className="text-[9px] uppercase font-bold text-emerald-700 shrink-0 ml-1">
                              Active
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Batch Priority & Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                      Priority for Selected States
                    </label>
                    <select
                      value={batchPriority}
                      onChange={(e) => setBatchPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white transition cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="primary">Primary</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={batchStartDate}
                      onChange={(e) => setBatchStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={batchEndDate}
                      onChange={(e) => setBatchEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Batch Notes */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                    Batch Assignment Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={batchNotes}
                    onChange={(e) => setBatchNotes(e.target.value)}
                    placeholder="e.g. Expanded multi-state regional franchise coverage."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-[#0575B8] focus:bg-white transition"
                  />
                </div>

                {/* Batch Submit Action */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading || batchSelectedStateIds.length === 0}
                    className="px-6 py-2.5 bg-[#0575B8] hover:bg-[#045D93] text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" /> Assigning States...
                      </>
                    ) : (
                      <>
                        <FaLayerGroup /> Assign {batchSelectedStateIds.length} Selected State(s)
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="text-[11px] text-slate-500">
            Total Authorized States: <strong className="text-slate-900">{activeTerritories.length}</strong> | Total Districts: <strong className="text-indigo-700">{totalAssignedDistricts}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
