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
        return { bg: 'bg-[#EFF8FF] text-[#0575B8] border-[#E2E8F0]', label: 'Approved & Active', icon: FiCheckCircle };
      case 'under_review':
      case 'submitted':
        return { bg: 'bg-[#FFF7ED] text-[#9A7300] border-[#F4922240]', label: 'Under Review', icon: FiClock };
      case 'gst_verified':
        return { bg: 'bg-[#EFF8FF] text-[#0575B8] border-[#E2E8F0]', label: 'GST Verified - Complete KYC', icon: FiCheckCircle };
      case 'more_info_required':
        return { bg: 'bg-[#FFF7ED] text-[#9A7300] border-[#F4922240]', label: 'Additional Documents Required', icon: FiAlertCircle };
      case 'rejected':
        return { bg: 'bg-red-50 text-red-800 border-red-300', label: 'Application Rejected', icon: FiAlertCircle };
      default:
        return { bg: 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]', label: 'Registration In Progress (Draft)', icon: FiFileText };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 bg-[#FFFFFF]">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-[#0575B8] uppercase tracking-widest bg-[#EFF8FF] px-3 py-1 rounded-full border border-[#E2E8F0]">
          Real-time Tracker
        </span>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-[#0F172A] tracking-tight">
          Track Distributor Onboarding Status
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] max-w-lg mx-auto">
          Enter the registered mobile number or Application Reference ID provided during registration to check your live review progress.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-xs space-y-6">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569] w-5 h-5" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter Mobile (e.g. 9876543210) or Application ID"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#0F172A] placeholder-[#475569] focus:outline-none focus:border-[#0575B8] focus:bg-[#FFFFFF]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-xl text-sm font-bold bg-[#0575B8] text-white hover:bg-[#045D93] shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {loading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiSearch className="w-4 h-4 text-[#F49222]" />}
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
          <div className="pt-6 border-t border-[#E2E8F0] space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-[#475569] font-mono">Reference: {result.application_id}</span>
                <h3 className="font-heading font-bold text-xl text-[#0F172A] mt-0.5">{result.business_name}</h3>
                <span className="text-xs text-[#475569]">Mobile: {result.mobile_masked}</span>
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
              <div className="flex justify-between text-xs text-[#475569]">
                <span>Wizard Progress (Step {result.step_completed} of {result.total_steps})</span>
                <span className="font-bold text-[#0575B8]">{result.progress_percentage}% Complete</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F8FAFC] overflow-hidden border border-[#E2E8F0]">
                <div
                  className="h-full bg-[#0575B8] rounded-full transition-all duration-500"
                  style={{ width: `${result.progress_percentage}%` }}
                />
              </div>
            </div>

            {/* Rejection / More Info details */}
            {result.more_info_request && (
              <div className="p-4 rounded-xl bg-[#FFF7ED] border border-[#F4922240] space-y-1 text-xs text-[#9A7300]">
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
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0575B8] hover:bg-[#045D93] text-white shadow-xs flex items-center gap-2 transition-all"
              >
                Sign In to Resume Application <FiArrowRight className="text-[#F49222]" />
              </Link>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
