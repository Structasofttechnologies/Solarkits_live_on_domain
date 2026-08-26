import React, { useState, useEffect } from 'react';
import { FaMapMarkedAlt, FaTimes, FaCheck, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import { bdeApi } from '../../../api/bdeApi';

export default function TerritoryModal({ isOpen, onClose, bde, onSuccess }) {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedStateName, setSelectedStateName] = useState('');
  const [selectedDistrictIds, setSelectedDistrictIds] = useState([]);
  const [priority, setPriority] = useState('medium');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [fetchingDistricts, setFetchingDistricts] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchStates();
      if (bde) {
        const existingStateId = bde.state_id || bde.territory?.state_id || '';
        const existingStateName = bde.state_name || bde.territory?.state_name || '';
        setSelectedStateId(existingStateId);
        setSelectedStateName(existingStateName);
        setPriority(bde.territory?.priority || 'medium');
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('');
        setNotes(bde.territory?.notes || '');
        setError(null);
      }
    }
  }, [isOpen, bde]);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const res = await bdeApi.getStates();
      const stateList = res.states || res.data || [];
      setStates(stateList);
    } catch (err) {
      console.error('Failed to fetch states in TerritoryModal', err);
      setError('Could not load states list. Please check your network or permissions.');
    } finally {
      setLoadingStates(false);
    }
  };

  useEffect(() => {
    if (selectedStateId) {
      fetchDistricts(selectedStateId);
    } else {
      setDistricts([]);
      setSelectedDistrictIds([]);
    }
  }, [selectedStateId]);

  const fetchDistricts = async (stateId) => {
    setFetchingDistricts(true);
    try {
      const res = await bdeApi.getDistricts(stateId);
      const districtList = res.districts || res.data || [];
      setDistricts(districtList);

      // Pre-select existing districts if any
      const existingNames = bde?.assigned_districts || bde?.territory?.district_names || [];
      const existingIds = bde?.territory?.district_ids?.map(id => id.toString()) || [];

      if (districtList.length > 0) {
        const matchingIds = districtList
          .filter(d => {
            const dId = (d._id || d.id || '').toString();
            return existingIds.includes(dId) || existingNames.includes(d.name);
          })
          .map(d => d._id || d.id);

        if (matchingIds.length > 0) {
          setSelectedDistrictIds(matchingIds);
        }
      }
    } catch (err) {
      console.error('Failed to fetch districts in TerritoryModal', err);
    } finally {
      setFetchingDistricts(false);
    }
  };

  if (!isOpen || !bde) return null;

  const handleStateChange = (e) => {
    const sId = e.target.value;
    setSelectedStateId(sId);
    const selectedStateObj = states.find(s => (s._id || s.id) === sId);
    setSelectedStateName(selectedStateObj ? selectedStateObj.name : '');
    setSelectedDistrictIds([]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
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
        bde_id: bde._id || bde.id,
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

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to assign territory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-slate-50 to-white">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-100 text-[#0575B8] rounded-2xl shadow-xs">
              <FaMapMarkedAlt className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Assign Territory & Districts</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Assign authorized state and district jurisdiction to <span className="font-bold text-slate-900">{bde.full_name}</span> ({bde.bde_id})
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2 font-semibold">
              <FaExclamationCircle className="text-rose-600 shrink-0" /> {error}
            </div>
          )}

          {/* State Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                State *
              </label>
              {loadingStates && (
                <span className="text-[11px] text-[#0575B8] font-bold flex items-center gap-1">
                  <FaSpinner className="animate-spin text-xs" /> Loading active states...
                </span>
              )}
            </div>
            <select
              value={selectedStateId}
              onChange={handleStateChange}
              required
              disabled={loadingStates}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white transition cursor-pointer disabled:opacity-60"
            >
              <option value="">
                {loadingStates ? 'Loading active states from location settings...' : 'Select State'}
              </option>
              {states.map(s => (
                <option key={s._id || s.id} value={s._id || s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Districts Multi-Select */}
          {selectedStateId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Districts ({selectedDistrictIds.length} of {districts.length} selected)
                </label>
                {districts.length > 0 && (
                  <button
                    type="button"
                    onClick={selectAllDistricts}
                    className="text-xs text-[#0575B8] font-bold hover:underline cursor-pointer"
                  >
                    {selectedDistrictIds.length === districts.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {fetchingDistricts ? (
                <div className="text-xs text-slate-500 py-6 text-center bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 font-medium">
                  <FaSpinner className="animate-spin text-[#0575B8]" /> Loading active districts for selected state...
                </div>
              ) : districts.length === 0 ? (
                <div className="text-xs text-amber-800 py-4 text-center bg-amber-50 rounded-2xl border border-amber-200 font-medium">
                  No active districts found for this state in Location Settings.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  {districts.map(d => {
                    const dId = d._id || d.id;
                    const isSelected = selectedDistrictIds.includes(dId);
                    return (
                      <button
                        type="button"
                        key={dId}
                        onClick={() => toggleDistrict(dId)}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 text-[#0575B8] border-2 border-[#0575B8] shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{d.name}</span>
                        {isSelected && <FaCheck className="text-[11px] shrink-0 ml-1 text-[#0575B8]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Priority & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lead territory executive for regional expansion."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:border-[#0575B8] focus:bg-white transition"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#0575B8] hover:bg-[#045D93] text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Assigning...' : 'Confirm Territory Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
