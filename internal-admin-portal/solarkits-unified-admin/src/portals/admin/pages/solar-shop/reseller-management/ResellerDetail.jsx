import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiArrowLeft,
  FiUser,
  FiFileText,
  FiShield,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiLoader,
  FiExternalLink,
  FiPlusCircle,
  FiMapPin,
  FiMail,
  FiPhone,
  FiZap,
  FiShoppingBag,
  FiEye,
  FiDownload,
  FiX,
} from "react-icons/fi";
import { authHeaderObj } from "@/app/authHeader";
import { setAlert } from "../../../features/alert.slice";

const API_BASE = import.meta.env.VITE_API_URL;
const MODULE_UID = "RSL_MGMT";
const KYC_UID = "RSL_KYC";

const DOC_TYPES = [
  { key: "pan_card",         name: "PAN Card",            required: true },
  { key: "shop_photo",       name: "Shop / Business Photo", required: true },
  { key: "gst_certificate",  name: "GST Certificate",     required: false },
  { key: "aadhaar_front",    name: "Aadhaar (Front)",     required: false },
  { key: "aadhaar_back",     name: "Aadhaar (Back)",      required: false },
  { key: "address_proof",    name: "Address Proof",       required: false },
  { key: "cancelled_cheque", name: "Cancelled Cheque",    required: false },
];

const getDocUrl = (storageKey) => {
  if (!storageKey) return "";
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    return storageKey;
  }
  const cleanPath = storageKey.replace(/\\/g, "/").replace(/^public\//, "");
  const serverBase = API_BASE.replace(/\/admin-api$|\/api$/, "");
  return `${serverBase}/${cleanPath.startsWith("uploads/") ? cleanPath : "uploads/" + cleanPath}`;
};

function KycReviewModal({ decision, resellerName, onClose, onConfirm }) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isVerify = decision === "verify";
  const title = isVerify ? "Verify KYC Documents?" : decision === "reject" ? "Reject KYC Documents?" : "Request Resubmission?";

  const handleConfirm = async () => {
    if (!isVerify && !note.trim()) return;
    setSubmitting(true);
    await onConfirm(decision, note.trim());
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <p className="text-xs text-text-muted">Target Reseller: <strong className="text-text-primary">{resellerName}</strong></p>

        {!isVerify && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Reason / Note <span className="text-danger">*</span></label>
            <textarea
              rows={3}
              required
              placeholder={decision === "reject" ? "e.g. Invalid PAN Card details" : "e.g. Re-upload clear photo of shop premises"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-xs font-semibold hover:bg-surface-hover">Cancel</button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || (!isVerify && !note.trim())}
            className={`flex-1 py-2.5 rounded-xl text-white text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 ${
              isVerify ? "bg-success hover:bg-success-hover" : "bg-danger hover:bg-danger-hover"
            }`}
          >
            {submitting ? <FiLoader className="animate-spin" size={14} /> : null}
            {isVerify ? "Approve KYC" : "Submit Decision"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DocViewerModal({ docName, docUrl, onClose }) {
  const isPdf = docUrl?.toLowerCase().endsWith(".pdf");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <FiShield className="text-primary" /> {docName}
          </h3>
          <div className="flex items-center gap-2">
            <a
              href={docUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover flex items-center gap-1 shadow-sm"
            >
              <FiExternalLink size={14} /> Open Full Size
            </a>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted transition-colors cursor-pointer">
              <FiX size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-bg">
          {isPdf ? (
            <iframe src={docUrl} title={docName} className="w-full h-[600px] rounded-xl border border-border" />
          ) : (
            <img src={docUrl} alt={docName} className="max-h-[600px] max-w-full rounded-xl object-contain shadow-md" />
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResellerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [reseller, setReseller] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("kyc");

  const [kycModal, setKycModal] = useState(null); // 'verify' | 'reject' | 'resubmit'
  const [planModal, setPlanModal] = useState(false);
  const [viewDoc, setViewDoc] = useState(null); // { name, url }

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/reseller-mgmt/detail/${id}?req_for=view&unique_id=${MODULE_UID}`, {
        headers: authHeaderObj(),
      });
      if (res.data?.status === "success") {
        setReseller(res.data.data.reseller);
        setKyc(res.data.data.kyc);
        setActiveSub(res.data.data.active_subscription);
        setAuditHistory(res.data.data.audit_history || []);
      }
    } catch {
      dispatch(setAlert({ type: "error", message: "Failed to load reseller details" }));
    } finally {
      setLoading(false);
    }
  }, [id, dispatch]);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/resellers/plans/list?req_for=view&unique_id=RSL_PLAN&active_only=true`, {
        headers: authHeaderObj(),
      });
      if (res.data?.status === "success") setPlans(res.data.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchDetail();
    fetchPlans();
  }, [fetchDetail, fetchPlans]);

  const handleKycReview = async (decision, note) => {
    try {
      const res = await axios.put(
        `${API_BASE}/reseller-mgmt/kyc/review/${id}?req_for=edit&unique_id=${KYC_UID}`,
        { decision, note },
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: `KYC status updated: ${decision}` }));
        fetchDetail();
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "KYC review failed" }));
    }
  };

  const handleActivationChange = async (status) => {
    try {
      const res = await axios.put(
        `${API_BASE}/reseller-mgmt/activation-status/${id}?req_for=edit&unique_id=${MODULE_UID}`,
        { activation_status: status, reason: `Account set to ${status} by Admin` },
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: `Reseller status set to ${status}` }));
        fetchDetail();
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Status change failed" }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted gap-3">
        <FiLoader className="animate-spin text-primary" size={20} />
        <span className="text-sm">Loading reseller details...</span>
      </div>
    );
  }

  if (!reseller) {
    return (
      <div className="text-center py-20 text-text-muted">Reseller not found</div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-hover text-text-muted transition-colors">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">{reseller.business_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-info-soft text-primary uppercase">
                {reseller.commercial_mode}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">Partner ID: {reseller.id}</p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2">
          {reseller.activation_status === "active" ? (
            <button
              onClick={() => handleActivationChange("suspended")}
              className="px-3.5 py-2 rounded-xl bg-danger-soft text-danger border border-danger/20 text-xs font-semibold hover:bg-danger hover:text-white transition-all shadow-sm"
            >
              Suspend Reseller
            </button>
          ) : (
            <button
              onClick={() => handleActivationChange("active")}
              disabled={reseller.kyc_status !== "verified"}
              title={reseller.kyc_status !== "verified" ? "Verify KYC first to activate" : ""}
              className="px-3.5 py-2 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success-hover transition-all disabled:opacity-50 shadow-sm"
            >
              Activate Reseller
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-1">
        {[
          { id: "kyc",          label: "KYC Documents",    icon: FiShield },
          { id: "profile",      label: "Business Profile", icon: FiUser },
          { id: "subscription", label: "Plan & Territory", icon: FiFileText },
          { id: "audit",        label: "Audit Trail",      icon: FiClock },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                active ? "border-primary text-primary bg-info-soft/30 rounded-t-xl" : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        {/* ── KYC TAB ── */}
        {activeTab === "kyc" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary">KYC Document Verification</h3>
                <p className="text-xs text-text-muted mt-0.5">Review uploaded business identity documents before approval</p>
              </div>

              {/* Review Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setKycModal("resubmit")}
                  className="px-3.5 py-2 rounded-xl border border-border text-text-secondary text-xs font-semibold hover:bg-surface-hover transition-all cursor-pointer"
                >
                  Request Resubmit
                </button>
                <button
                  onClick={() => setKycModal("reject")}
                  className="px-3.5 py-2 rounded-xl bg-danger-soft text-danger border border-danger/20 text-xs font-semibold hover:bg-danger hover:text-white transition-all cursor-pointer"
                >
                  Reject
                </button>
                <button
                  onClick={() => setKycModal("verify")}
                  className="px-4 py-2 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success-hover transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <FiCheckCircle size={14} />
                  Verify & Approve
                </button>
              </div>
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DOC_TYPES.map((docDef) => {
                const uploaded = kyc?.docs?.[docDef.key];
                return (
                  <div key={docDef.key} className="p-4 rounded-xl border border-border bg-bg space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{docDef.name}</p>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            {docDef.required ? <span className="text-danger font-medium">Mandatory</span> : "Optional"}
                          </p>
                        </div>
                        {uploaded ? (
                          <span className="text-success text-xs font-semibold flex items-center gap-1 bg-success-soft px-2 py-0.5 rounded-full">
                            <FiCheckCircle size={11} /> Uploaded
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs font-medium bg-surface px-2 py-0.5 rounded-full border border-border">
                            Not Uploaded
                          </span>
                        )}
                      </div>

                      {uploaded && (() => {
                        const fileUrl = getDocUrl(uploaded.storage_key);
                        const isImage = !uploaded.storage_key?.toLowerCase().endsWith(".pdf") && !uploaded.original_name?.toLowerCase().endsWith(".pdf");
                        return (
                          <div className="space-y-2.5 pt-1">
                            {isImage && (
                              <div
                                onClick={() => setViewDoc({ name: docDef.name, url: fileUrl })}
                                className="h-32 rounded-lg overflow-hidden border border-border bg-surface flex items-center justify-center cursor-pointer group relative shadow-xs"
                              >
                                <img src={fileUrl} alt={docDef.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                                  <FiEye size={16} /> Click to Preview
                                </div>
                              </div>
                            )}

                            <div className="text-xs text-text-secondary space-y-2 bg-surface p-2.5 rounded-lg border border-border">
                              <p className="truncate font-mono text-[11px] font-semibold">{uploaded.original_name}</p>
                              <p className="text-[10px] text-text-muted">
                                {(uploaded.size_bytes / 1024).toFixed(1)} KB • {new Date(uploaded.uploaded_at).toLocaleDateString()}
                              </p>

                              <div className="flex items-center gap-2 pt-1.5 border-t border-border">
                                <button
                                  type="button"
                                  onClick={() => setViewDoc({ name: docDef.name, url: fileUrl })}
                                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                                  className="flex-1 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                                >
                                  <FiEye size={14} /> View 👁️
                                </button>
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 border border-slate-300"
                                >
                                  <FiExternalLink size={13} /> Open
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {kycModal && (
        <KycReviewModal
          decision={kycModal}
          resellerName={reseller.business_name}
          onClose={() => setKycModal(null)}
          onConfirm={handleKycReview}
        />
      )}

      {/* Document Viewer Modal */}
      {viewDoc && (
        <DocViewerModal
          docName={viewDoc.name}
          docUrl={viewDoc.url}
          onClose={() => setViewDoc(null)}
        />
      )}
    </div>
  );
}
