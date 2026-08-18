import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiArrowRight,
  FiShield,
  FiFileText,
  FiRefreshCw,
} from 'react-icons/fi';
import api from '../services/api';

export default function ApplicationStatusPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your mobile number or Application ID.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const res = await api.post('/public/application-status', { identifier: identifier.trim() });
      if (res.data?.success && res.data?.application) {
        setResult(res.data.application);
      } else {
        setError(res.data?.message || 'No application record found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Application lookup failed. Please verify your input.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
      case 'active':
        return { bg: 'bg-[#ECF8F1] text-[#1F8F4E] border-[#DDE8E1]', label: 'Approved & Active', icon: FiCheckCircle };
      case 'under_review':
      case 'submitted':
        return { bg: 'bg-[#FEF9E7] text-[#9A7300] border-[#F5B70040]', label: 'Under Review', icon: FiClock };
      case 'gst_verified':
        return { bg: 'bg-[#ECF8F1] text-[#1F8F4E] border-[#DDE8E1]', label: 'GST Verified - Complete KYC', icon: FiCheckCircle };
      case 'more_info_required':
        return { bg: 'bg-[#FEF9E7] text-[#9A7300] border-[#F5B70040]', label: 'Additional Documents Required', icon: FiAlertCircle };
      case 'rejected':
        return { bg: 'bg-red-50 text-red-800 border-red-300', label: 'Application Rejected', icon: FiAlertCircle };
      default:
        return { bg: 'bg-[#F7FAF8] text-[#5F6F65] border-[#DDE8E1]', label: 'Registration In Progress (Draft)', icon: FiFileText };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 bg-[#FFFFFF]">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest bg-[#ECF8F1] px-3 py-1 rounded-full border border-[#DDE8E1]">
          Real-time Tracker
        </span>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-[#17211B] tracking-tight">
          Track Distributor Onboarding Status
        </h1>
        <p className="text-xs sm:text-sm text-[#5F6F65] max-w-lg mx-auto">
          Enter the registered mobile number or Application Reference ID provided during registration to check your live review progress.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border border-[#DDE8E1] shadow-xs space-y-6">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5F6F65] w-5 h-5" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter Mobile (e.g. 9876543210) or Application ID"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-sm text-[#17211B] placeholder-[#5F6F65] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-xl text-sm font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {loading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiSearch className="w-4 h-4 text-[#F5B700]" />}
            Track Status
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
            <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Status Result Display */}
        {result && (
          <div className="pt-6 border-t border-[#DDE8E1] space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-[#5F6F65] font-mono">Reference: {result.application_id}</span>
                <h3 className="font-heading font-bold text-xl text-[#17211B] mt-0.5">{result.business_name}</h3>
                <span className="text-xs text-[#5F6F65]">Mobile: {result.mobile_masked}</span>
              </div>
              <div>
                {(() => {
                  const badge = getStatusBadge(result.current_status);
                  return (
                    <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border ${badge.bg}`}>
                      <badge.icon className="w-4 h-4" />
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[#5F6F65]">
                <span>Wizard Progress (Step {result.step_completed} of {result.total_steps})</span>
                <span className="font-bold text-[#1F8F4E]">{result.progress_percentage}% Complete</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F7FAF8] overflow-hidden border border-[#DDE8E1]">
                <div
                  className="h-full bg-[#1F8F4E] rounded-full transition-all duration-500"
                  style={{ width: `${result.progress_percentage}%` }}
                />
              </div>
            </div>

            {/* Rejection / More Info details */}
            {result.more_info_request && (
              <div className="p-4 rounded-xl bg-[#FEF9E7] border border-[#F5B70040] space-y-1 text-xs text-[#9A7300]">
                <h4 className="font-bold">Reviewer Clarification Request:</h4>
                <p>{result.more_info_request}</p>
              </div>
            )}

            {result.rejection_reason && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-1 text-xs text-red-800">
                <h4 className="font-bold">Reason for Rejection:</h4>
                <p>{result.rejection_reason}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Link
                to="/auth/login"
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#1F8F4E] hover:bg-[#18733E] text-white shadow-xs flex items-center gap-2 transition-all"
              >
                Sign In to Resume Application <FiArrowRight className="text-[#F5B700]" />
              </Link>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
