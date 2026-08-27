import React, { useState, useEffect } from 'react';
import { FaBullseye, FaTimes, FaExclamationCircle } from 'react-icons/fa';
import { bdeApi } from '../../../api/bdeApi';

export default function GoalModal({ isOpen, onClose, bde, onSuccess }) {
  const [periodType, setPeriodType] = useState('monthly');
  const [monthlySignupGoal, setMonthlySignupGoal] = useState(10);
  const [quarterlySignupGoal, setQuarterlySignupGoal] = useState(30);
  const [operationalStoreGoal, setOperationalStoreGoal] = useState(5);
  const [year, setYear] = useState(new Date().getFullYear());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingGoal, setFetchingGoal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && bde) {
      setError(null);
      loadGoalData();
    }
  }, [isOpen, bde]);

  const loadGoalData = async () => {
    // 1. Initial quick population from bde prop if available
    const existing = bde?.goal || bde?.current_goal;
    if (existing) {
      setPeriodType(existing.period_type || 'monthly');
      setMonthlySignupGoal(existing.monthly_franchisee_signup_goal ?? 10);
      setQuarterlySignupGoal(existing.quarterly_franchisee_signup_goal ?? 30);
      setOperationalStoreGoal(existing.operational_store_goal ?? 5);
      setYear(existing.year || new Date().getFullYear());
      setNotes(existing.notes || '');
    } else {
      setPeriodType('monthly');
      setMonthlySignupGoal(10);
      setQuarterlySignupGoal(30);
      setOperationalStoreGoal(5);
      setYear(new Date().getFullYear());
      setNotes('');
    }

    // 2. Fetch latest active goal from API to ensure fresh data
    const bdeId = bde._id || bde.id;
    if (!bdeId) return;

    try {
      setFetchingGoal(true);
      const res = await bdeApi.getGoals(bdeId);
      const activeGoal = res.data?.current || (res.data?.history && res.data.history[0]);
      if (activeGoal) {
        setPeriodType(activeGoal.period_type || 'monthly');
        setMonthlySignupGoal(activeGoal.monthly_franchisee_signup_goal ?? 10);
        setQuarterlySignupGoal(activeGoal.quarterly_franchisee_signup_goal ?? 30);
        setOperationalStoreGoal(activeGoal.operational_store_goal ?? 5);
        setYear(activeGoal.year || new Date().getFullYear());
        setNotes(activeGoal.notes || '');
      }
    } catch (err) {
      console.error('Failed to fetch latest goals in GoalModal', err);
    } finally {
      setFetchingGoal(false);
    }
  };

  if (!isOpen || !bde) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await bdeApi.assignGoals({
        bde_id: bde._id || bde.id,
        period_type: periodType,
        year: Number(year),
        monthly_franchisee_signup_goal: Number(monthlySignupGoal),
        quarterly_franchisee_signup_goal: Number(quarterlySignupGoal),
        operational_store_goal: Number(operationalStoreGoal),
        notes,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to assign goals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-slate-50 to-white">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-100 text-[#0575B8] rounded-2xl shadow-xs">
              <FaBullseye className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Assign Goals & Targets</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Set targets for <span className="font-bold text-slate-900">{bde.full_name}</span> ({bde.bde_id})
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2 font-semibold">
              <FaExclamationCircle className="text-rose-600 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Period Type</label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white transition"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Target Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min="2025"
                max="2035"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Monthly Signups</label>
              <input
                type="number"
                min="0"
                value={monthlySignupGoal}
                onChange={(e) => setMonthlySignupGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Quarterly Signups</label>
              <input
                type="number"
                min="0"
                value={quarterlySignupGoal}
                onChange={(e) => setQuarterlySignupGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Operational Stores</label>
              <input
                type="number"
                min="0"
                value={operationalStoreGoal}
                onChange={(e) => setOperationalStoreGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Strategy / Target Notes (Optional)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on high potential districts in state territory."
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
              className="px-6 py-2.5 bg-[#0575B8] hover:bg-[#045D93] text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Set BDE Targets'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
