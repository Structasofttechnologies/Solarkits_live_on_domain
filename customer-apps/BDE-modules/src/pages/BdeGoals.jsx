import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Target, TrendingUp, ShoppingBag, Award, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BdeGoals() {
  const [goalData, setGoalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/goals');
      setGoalData(res.data.data);
    } catch (err) {
      console.error('Failed to load goals', err);
    } finally {
      setLoading(false);
    }
  };

  const goal = goalData || {};
  const monthlyGoal = goal.monthly_franchisee_signup_goal || 0;
  const monthlyAchieved = goal.monthly_signup_achieved || 0;
  const monthlyPct = monthlyGoal > 0 ? Math.min(100, Math.round((monthlyAchieved / monthlyGoal) * 100)) : 0;

  const quarterlyGoal = goal.quarterly_franchisee_signup_goal || 0;
  const quarterlyAchieved = goal.quarterly_signup_achieved || 0;
  const quarterlyPct = quarterlyGoal > 0 ? Math.min(100, Math.round((quarterlyAchieved / quarterlyGoal) * 100)) : 0;

  const storeGoal = goal.operational_store_goal || 0;
  const storeAchieved = goal.operational_store_achieved || 0;
  const storePct = storeGoal > 0 ? Math.min(100, Math.round((storeAchieved / storeGoal) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Goals & Performance Targets</h1>
        <p className="text-xs text-slate-500">
          Monitor your franchisee acquisition targets, quarterly quotas, and store activation progress.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Target Card */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Target className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full uppercase">
              Monthly Goal
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Target Signups</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black text-slate-900">{monthlyAchieved}</span>
              <span className="text-sm font-bold text-slate-400">/ {monthlyGoal}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600">Progress</span>
              <span className="text-blue-600 font-bold">{monthlyPct}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${monthlyPct}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            {monthlyGoal - monthlyAchieved > 0
              ? `${monthlyGoal - monthlyAchieved} more signups required to hit your monthly milestone.`
              : '🎉 You have achieved your monthly target!'}
          </p>
        </div>

        {/* Quarterly Target Card */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-full uppercase">
              Quarterly Goal
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Quarterly Signups</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black text-slate-900">{quarterlyAchieved}</span>
              <span className="text-sm font-bold text-slate-400">/ {quarterlyGoal}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600">Progress</span>
              <span className="text-purple-600 font-bold">{quarterlyPct}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${quarterlyPct}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            {quarterlyGoal - quarterlyAchieved > 0
              ? `${quarterlyGoal - quarterlyAchieved} signups needed for full quarterly quota.`
              : '🎉 Quarterly milestone achieved!'}
          </p>
        </div>

        {/* Operational Store Target Card */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full uppercase">
              Store Goal
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Solar Stores</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black text-slate-900">{storeAchieved}</span>
              <span className="text-sm font-bold text-slate-400">/ {storeGoal}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600">Progress</span>
              <span className="text-emerald-600 font-bold">{storePct}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${storePct}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            {storeGoal - storeAchieved > 0
              ? `${storeGoal - storeAchieved} physical stores remaining to activate.`
              : '🎉 Store setup quota reached!'}
          </p>
        </div>
      </div>
    </div>
  );
}
