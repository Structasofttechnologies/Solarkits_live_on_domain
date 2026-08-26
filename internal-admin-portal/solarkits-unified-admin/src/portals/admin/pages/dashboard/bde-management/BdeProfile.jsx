import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaUserTie,
  FaArrowLeft,
  FaShieldAlt,
  FaMapMarkedAlt,
  FaBullseye,
  FaKey,
  FaEdit,
  FaExternalLinkAlt,
  FaHistory,
  FaCheckCircle,
  FaBan,
  FaBoxes,
} from 'react-icons/fa';
import { bdeApi } from '../../../api/bdeApi';
import Loader from '../../../components/Loader';
import KycReviewModal from './KycReviewModal';
import TerritoryModal from './TerritoryModal';
import GoalModal from './GoalModal';
import ResetLoginModal from './ResetLoginModal';

export default function BdeProfile({ moduleUniqueId = 'ADM_BDE_MGMT' }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bde, setBde] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [territoryModalOpen, setTerritoryModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [resetLoginModalOpen, setResetLoginModalOpen] = useState(false);

  useEffect(() => {
    fetchBdeDetail();
  }, [id]);

  const fetchBdeDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await bdeApi.getBdeDetail(id, moduleUniqueId);
      setBde(res.data);
    } catch (err) {
      console.error('Failed to load BDE profile', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (newStatus) => {
    try {
      await bdeApi.changeStatus(id, { status: newStatus, reason: `Admin changed status to ${newStatus}` }, moduleUniqueId);
      fetchBdeDetail();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update status');
    }
  };

  const handleKycReviewSuccess = async (reviewData) => {
    await bdeApi.reviewKyc(id, reviewData, moduleUniqueId);
    fetchBdeDetail();
  };

  if (loading) return <Loader text="Loading BDE Profile..." />;
  if (error || !bde) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <p className="text-rose-600 font-bold">{error || 'BDE not found'}</p>
        <button
          onClick={() => navigate('/admin-panel/bde-management/all')}
          className="px-5 py-2.5 bg-[#0575B8] text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          Back to BDE List
        </button>
      </div>
    );
  }

  const kyc = bde.kyc || {};
  const territory = bde.territory || {};
  const plans = bde.plans || {};
  const goal = bde.goal || {};
  const activities = bde.recent_activities || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-slate-900 font-sans">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin-panel/bde-management/all')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer"
        >
          <FaArrowLeft /> Back to All BDEs
        </button>
        <button
          onClick={() => navigate(`/admin-panel/bde-management/edit/${id}`)}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
        >
          <FaEdit /> Edit Details
        </button>
      </div>

      {/* Main Header Banner */}
      <div className="p-6 md:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-slate-50 border border-blue-200 flex items-center justify-center text-[#0575B8] text-3xl font-black shrink-0 overflow-hidden shadow-xs">
            {bde.profile_photo ? (
              <img src={bde.profile_photo} alt={bde.full_name} className="w-full h-full object-cover" />
            ) : (
              bde.full_name.charAt(0)
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{bde.full_name}</h1>
              <span className="px-3 py-1 bg-blue-50 text-[#0575B8] border border-blue-200 font-mono font-bold text-xs rounded-full">
                {bde.bde_id}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {bde.email} • <span className="font-mono text-slate-700">{bde.mobile_number}</span>
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                bde.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : bde.status === 'suspended'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {bde.status}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                kyc.kyc_status === 'verified'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                KYC: {kyc.kyc_status || 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setKycModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <FaShieldAlt /> Verify KYC
          </button>
          <button
            onClick={() => setTerritoryModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <FaMapMarkedAlt /> Assign Territory
          </button>
          <button
            onClick={() => setGoalModalOpen(true)}
            className="px-4 py-2.5 bg-[#0575B8] hover:bg-[#045D93] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <FaBullseye /> Assign Goals
          </button>
          <button
            onClick={() => setResetLoginModalOpen(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-amber-600 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <FaKey /> Reset Login
          </button>
          {bde.status === 'active' ? (
            <button
              onClick={() => handleStatusToggle('suspended')}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <FaBan /> Suspend
            </button>
          ) : (
            <button
              onClick={() => handleStatusToggle('active')}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <FaCheckCircle /> Activate
            </button>
          )}
        </div>
      </div>

      {/* Grid of Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal & Employment Details */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <FaUserTie className="text-[#0575B8]" /> Personal & Employment Details
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px]">Full Name</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{bde.full_name}</p>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px]">BDE ID</span>
              <p className="font-mono font-bold text-[#0575B8] text-sm mt-0.5">{bde.bde_id}</p>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px]">Mobile Number</span>
              <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{bde.mobile_number}</p>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px]">Email Address</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">{bde.email}</p>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px]">Joining Date</span>
              <p className="font-bold text-slate-900 mt-0.5">
                {bde.joining_date ? new Date(bde.joining_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px]">Last Login</span>
              <p className="font-bold text-slate-900 mt-0.5">
                {bde.last_login_at ? new Date(bde.last_login_at).toLocaleString() : 'Never logged in'}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Address</span>
              <p className="text-slate-700 font-medium mt-0.5">{bde.address || 'No address specified'}</p>
            </div>
          </div>
        </div>

        {/* KYC Details Card */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FaShieldAlt className="text-emerald-600" /> KYC Verification Records
            </h2>
            <button
              onClick={() => setKycModalOpen(true)}
              className="text-xs text-[#0575B8] font-bold hover:underline cursor-pointer"
            >
              Review / Update
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-500 uppercase text-[10px] font-bold block">Aadhaar Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{kyc.aadhaar_masked || 'XXXXXXXXXXXX'}</span>
              </div>
              {kyc.aadhaar_document_url && (
                <a
                  href={kyc.aadhaar_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-50 text-[#0575B8] hover:bg-blue-100 rounded-xl font-bold flex items-center gap-1.5 transition"
                >
                  <FaExternalLinkAlt className="text-[10px]" /> View Aadhaar
                </a>
              )}
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-500 uppercase text-[10px] font-bold block">PAN Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm uppercase">{kyc.pan_masked || 'XXXXXXXXXX'}</span>
              </div>
              {kyc.pan_document_url && (
                <a
                  href={kyc.pan_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-50 text-[#0575B8] hover:bg-blue-100 rounded-xl font-bold flex items-center gap-1.5 transition"
                >
                  <FaExternalLinkAlt className="text-[10px]" /> View PAN
                </a>
              )}
            </div>

            {kyc.kyc_remarks && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-500 uppercase text-[10px] block font-bold">Remarks</span>
                <p className="text-slate-700 mt-0.5 font-medium">{kyc.kyc_remarks}</p>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Territory Card */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FaMapMarkedAlt className="text-indigo-600" /> Assigned Territory & Districts
            </h2>
            <button
              onClick={() => setTerritoryModalOpen(true)}
              className="text-xs text-[#0575B8] font-bold hover:underline cursor-pointer"
            >
              Reassign
            </button>
          </div>

          {territory && territory.state_name ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Assigned State:</span>
                <span className="font-bold text-slate-900 text-sm">{territory.state_name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Priority Level:</span>
                <span className="font-bold uppercase text-[#0575B8]">{territory.priority || 'medium'}</span>
              </div>
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Districts ({territory.district_names?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {territory.district_names?.map((dName, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs border border-indigo-100"
                    >
                      {dName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500 space-y-2 font-medium">
              <p>No territory assigned yet.</p>
              <button
                onClick={() => setTerritoryModalOpen(true)}
                className="px-4 py-2 bg-[#0575B8] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Assign Now
              </button>
            </div>
          )}
        </div>

        {/* Assigned Franchisee Plans Card */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FaBoxes className="text-amber-600" /> Assigned Franchisee Plans
            </h2>
          </div>

          {plans && plans.plan_names && plans.plan_names.length > 0 ? (
            <div className="space-y-2">
              {plans.plan_names.map((pName, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-900">{pName}</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase">
                    Active
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500 font-medium">
              No specific franchisee plan restrictions assigned (all active platform plans accessible).
            </div>
          )}
        </div>

        {/* Targets & Goals Card */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FaBullseye className="text-[#0575B8]" /> Current Performance Goals & Targets
            </h2>
            <button
              onClick={() => setGoalModalOpen(true)}
              className="text-xs text-[#0575B8] font-bold hover:underline cursor-pointer"
            >
              Update Targets
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Monthly Franchisee Signups</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#0575B8]">
                  {goal.monthly_signup_achieved || 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ {goal.monthly_franchisee_signup_goal || 0} target</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#0575B8] h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${goal.monthly_franchisee_signup_goal > 0 ? Math.min(100, Math.round(((goal.monthly_signup_achieved || 0) / goal.monthly_franchisee_signup_goal) * 100)) : 0}%`
                  }}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Quarterly Franchisee Signups</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-indigo-700">
                  {goal.quarterly_signup_achieved || 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ {goal.quarterly_franchisee_signup_goal || 0} target</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${goal.quarterly_franchisee_signup_goal > 0 ? Math.min(100, Math.round(((goal.quarterly_signup_achieved || 0) / goal.quarterly_franchisee_signup_goal) * 100)) : 0}%`
                  }}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Operational Store Setup</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700">
                  {goal.operational_store_achieved || 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ {goal.operational_store_goal || 0} target</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${goal.operational_store_goal > 0 ? Math.min(100, Math.round(((goal.operational_store_achieved || 0) / goal.operational_store_goal) * 100)) : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline Card */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <FaHistory className="text-[#0575B8]" /> Recent BDE Activity & Audit Trail
          </h2>

          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <div className="p-2.5 rounded-xl bg-blue-100 text-[#0575B8] font-bold mt-0.5">
                    {act.action.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{act.action}</span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {act.createdAt ? new Date(act.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium">{act.notes || 'Activity recorded'}</p>
                    {act.actor_name && (
                      <span className="text-[10px] text-slate-400 block font-medium">
                        By: {act.actor_name} ({act.actor_type})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center font-medium">No recent activity logs found for this BDE.</p>
          )}
        </div>
      </div>

      {/* Modals */}
      <KycReviewModal
        isOpen={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        bde={bde}
        onReviewSuccess={handleKycReviewSuccess}
      />

      <TerritoryModal
        isOpen={territoryModalOpen}
        onClose={() => setTerritoryModalOpen(false)}
        bde={bde}
        onSuccess={fetchBdeDetail}
      />

      <GoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        bde={bde}
        onSuccess={fetchBdeDetail}
      />

      <ResetLoginModal
        isOpen={resetLoginModalOpen}
        onClose={() => setResetLoginModalOpen(false)}
        bde={bde}
        onSuccess={fetchBdeDetail}
      />
    </div>
  );
}
