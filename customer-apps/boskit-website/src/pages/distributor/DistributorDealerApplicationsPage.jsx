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
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#17211B]">
            Dealer Onboarding Applications
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6F65] mt-0.5">
            Review sub-dealer dealership applications submitted for operations within your territory.
          </p>
        </div>

        <button
          onClick={fetchApps}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FFFFFF] hover:bg-[#F7FAF8] text-[#17211B] border border-[#DDE8E1] flex items-center gap-2 self-start shadow-xs"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-[#ECF8F1] border border-[#DDE8E1] text-[#1F8F4E] text-xs font-semibold flex items-center gap-2">
          <FiCheck /> {msg}
        </div>
      )}

      <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#17211B]">
            <thead className="bg-[#F7FAF8] text-[#5F6F65] font-bold uppercase text-[10px] border-b border-[#DDE8E1]">
              <tr>
                <th className="p-3.5">Dealer Business Name</th>
                <th className="p-3.5">GSTIN</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Submitted</th>
                <th className="p-3.5 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE8E1]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#5F6F65]">
                    Loading dealer applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#5F6F65]">
                    No pending dealer applications in your territory queue.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-[#F7FAF8] transition-colors">
                    <td className="p-3.5 font-bold text-[#17211B] text-sm">
                      {app.business_name}
                    </td>
                    <td className="p-3.5 font-mono text-[#1F8F4E]">
                      {app.gst_number || 'Unregistered'}
                    </td>
                    <td className="p-3.5 text-[#5F6F65]">
                      <div>{app.email}</div>
                      <div className="text-[11px] text-[#5F6F65]">{app.mobile}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#FEF9E7] text-[#9A7300] border border-[#F5B70040]">
                        {app.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#5F6F65]">
                      {new Date(app.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleReview(app.id, 'approve')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-xs"
                      >
                        Approve Dealer
                      </button>
                      <button
                        onClick={() => handleReview(app.id, 'reject')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F7FAF8] text-red-600 hover:bg-red-50 border border-[#DDE8E1]"
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
