import React, { useState, useEffect } from 'react';
import { FiFileText, FiCheckCircle, FiXCircle, FiRefreshCw, FiCheck } from 'react-icons/fi';
import api from '../../services/api';

export default function DistributorDealerApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchApps = () => {
    setLoading(true);
    api
      .get('/distributor/dealer-applications')
      .then((res) => {
        if (res.data?.success) setApplications(res.data.applications || []);
      })
      .catch((err) => console.error('Error fetching dealer apps:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleReview = async (appId, action) => {
    try {
      setActionLoading(true);
      setMsg('');
      const res = await api.post(`/distributor/dealer-applications/${appId}/review`, {
        action,
      });
      if (res.data?.success) {
        setMsg(`Dealer application ${action}d successfully.`);
        setTimeout(() => setMsg(''), 3000);
        fetchApps();
      }
    } catch (err) {
      console.error('Review error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#0F172A]">
            Dealer Onboarding Applications
          </h1>
          <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
            Review sub-dealer dealership applications submitted for operations within your territory.
          </p>
        </div>

        <button
          onClick={fetchApps}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] flex items-center gap-2 self-start shadow-xs"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-[#EFF8FF] border border-[#E2E8F0] text-[#0575B8] text-xs font-semibold flex items-center gap-2">
          <FiCheck /> {msg}
        </div>
      )}

      <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#0F172A]">
            <thead className="bg-[#F8FAFC] text-[#475569] font-bold uppercase text-[10px] border-b border-[#E2E8F0]">
              <tr>
                <th className="p-3.5">Dealer Business Name</th>
                <th className="p-3.5">GSTIN</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Submitted</th>
                <th className="p-3.5 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#475569]">
                    Loading dealer applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#475569]">
                    No pending dealer applications in your territory queue.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-3.5 font-bold text-[#0F172A] text-sm">
                      {app.business_name}
                    </td>
                    <td className="p-3.5 font-mono text-[#0575B8]">
                      {app.gst_number || 'Unregistered'}
                    </td>
                    <td className="p-3.5 text-[#475569]">
                      <div>{app.email}</div>
                      <div className="text-[11px] text-[#475569]">{app.mobile}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#FFF7ED] text-[#9A7300] border border-[#F4922240]">
                        {app.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#475569]">
                      {new Date(app.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleReview(app.id, 'approve')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0575B8] text-white hover:bg-[#045D93] shadow-xs"
                      >
                        Approve Dealer
                      </button>
                      <button
                        onClick={() => handleReview(app.id, 'reject')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F8FAFC] text-red-600 hover:bg-red-50 border border-[#E2E8F0]"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
