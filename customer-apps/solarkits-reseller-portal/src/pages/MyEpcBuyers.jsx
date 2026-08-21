import { useState, useEffect, useRef } from "react";
import {
  FiUsers, FiPlus, FiCheckCircle, FiClock, FiXCircle,
  FiLoader, FiMail, FiPhone, FiShield, FiBriefcase,
  FiUser, FiLock, FiMapPin, FiArrowRight, FiRefreshCw, FiAlertCircle, FiX
} from "react-icons/fi";
import api from "../services/api";

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const GST_STATE_MAP = {
  "01":"Jammu & Kashmir","02":"Himachal Pradesh","03":"Punjab","04":"Chandigarh",
  "05":"Uttarakhand","06":"Haryana","07":"Delhi","08":"Rajasthan","09":"Uttar Pradesh",
  "10":"Bihar","11":"Sikkim","12":"Arunachal Pradesh","13":"Nagaland","14":"Manipur",
  "15":"Mizoram","16":"Tripura","17":"Meghalaya","18":"Assam","19":"West Bengal",
  "20":"Jharkhand","21":"Odisha","22":"Chhattisgarh","23":"Madhya Pradesh",
  "24":"Gujarat","25":"Daman & Diu","26":"Dadra & Nagar Haveli","27":"Maharashtra",
  "28":"Andhra Pradesh","29":"Karnataka","30":"Goa","31":"Lakshadweep","32":"Kerala",
  "33":"Tamil Nadu","34":"Puducherry","35":"Andaman & Nicobar Islands","36":"Telangana",
  "37":"Andhra Pradesh (New)","38":"Ladakh","97":"Other Territory","99":"Centre Jurisdiction",
};

export default function MyEpcBuyers() {
  const [buyers, setBuyers] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  // Registration Multi-Step State
  const [step, setStep] = useState(1); // 1 = GST verify, 2 = EPC details form
  const [gstInput, setGstInput] = useState("");
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstError, setGstError] = useState("");
  const [gstResult, setGstResult] = useState(null);

  const [form, setForm] = useState({
    name:         "",
    email:        "",
    whatsapp:     "",
    company_name: "",
    password:     "",
    state_id:     "",
    district_id:  "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const gstInputRef = useRef(null);

  const fetchBuyers = () => {
    setLoading(true);
    api.get('/india/v1/reseller/epc-buyers/list')
      .then((res) => { if (res.data?.status === "success") setBuyers(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBuyers();
    api.get('/india/v1/reseller/territories')
      .then((res) => {
        if (res.data?.status === "success" && res.data.data?.length > 0) {
          setTerritories(res.data.data);
          const first = res.data.data[0];
          setForm((f) => ({
            ...f,
            state_id: first.state_id || first.state?.id || "",
            district_id: first.district_id || first.district?.id || "",
          }));
        }
      })
      .catch(() => {});

    api.get('/india/v1/reseller/plans/my-subscription')
      .then((res) => {
        if (res.data?.status === "success" && res.data.data) {
          setPlan(res.data.data.plan || res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const gstStateName = gstInput.length >= 2
    ? (GST_STATE_MAP[gstInput.substring(0, 2).toUpperCase()] || null)
    : null;

  // ── Step 1: Verify GST ───────────────────────────────────────────────────────
  const handleVerifyGst = async () => {
    const gstin = gstInput.trim().toUpperCase();
    setGstError("");

    if (!gstin) { setGstError("Please enter EPC buyer's GSTIN."); return; }
    if (!GSTIN_REGEX.test(gstin)) {
      setGstError("Invalid GSTIN format. Example: 27ABCDE1234F1Z5");
      return;
    }

    setGstVerifying(true);
    try {
      const res = await api.post("/india/v1/reseller/gst/verify", { gstin, context: "epc_onboarding" });
      if (res.data?.status === "success") {
        const d = res.data.data;
        setGstResult(d);
        const bizName = d.legal_name || d.trade_name || "";
        setForm((f) => ({
          ...f,
          company_name: bizName,
        }));
      } else {
        setGstError(res.data?.message || "GST verification failed.");
      }
    } catch (err) {
      setGstError(err.response?.data?.message || "Could not verify GSTIN. Please check format.");
    } finally {
      setGstVerifying(false);
    }
  };

  const handleResetGst = () => {
    setGstResult(null);
    setGstError("");
    setGstInput("");
    setStep(1);
    setTimeout(() => gstInputRef.current?.focus(), 100);
  };

  const handleOpenModal = () => {
    setModal(true);
    setStep(1);
    setGstInput("");
    setGstResult(null);
    setGstError("");
    setError("");
    setForm({ name: "", email: "", whatsapp: "", company_name: "", password: "", state_id: form.state_id, district_id: form.district_id });
  };

  // ── Step 2: Register Submit ──────────────────────────────────────────────────
  const handleRegisterEpc = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        ...form,
        name:           form.name.trim(),
        company_name:   form.company_name.trim(),
        email:          form.email.trim().toLowerCase(),
        whatsapp:       form.whatsapp.trim(),
        gstin:          gstInput.trim().toUpperCase(),
        gst_verified:   !!gstResult,
        gst_legal_name: gstResult?.legal_name || null,
        gst_trade_name: gstResult?.trade_name || null,
      };

      const res = await api.post('/india/v1/reseller/epc-buyers/register', payload);
      if (res.data?.status === "success") {
        alert("🎉 EPC Buyer sub-account registered successfully! Verification request sent to Admin Panel.");
        setModal(false);
        fetchBuyers();
      } else {
        setError(res.data?.message || "Registration failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please verify buyer details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FiUsers className="text-blue-600" size={28} />
            My Buyers
          </h1>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Register and manage wholesale buyer accounts in your authorized territory.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/30 cursor-pointer"
        >
          <FiPlus size={18} /> Register New Buyer
        </button>
      </div>

      {/* Plan Scope & Territory Authorization Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <FiShield size={20} />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">
              Franchisee Territory Onboarding Rights
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {plan ? (
                <>
                  <span className="text-blue-600 font-extrabold">{plan.name}</span> ({plan.territory_level?.toUpperCase()} Plan) — Authorized to onboard EPC Buyers across{" "}
                  <span className="text-emerald-700 font-black">
                    {territories.map((t) => t.location_name || t.state?.name || t.district?.name).join(", ") || "Authorized Territories"}
                  </span>
                </>
              ) : (
                "Authorized to onboard EPC Buyers across registered territories"
              )}
            </div>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
          Total Onboarded: <span className="font-bold text-slate-900">{buyers.length} EPCs</span>
        </div>
      </div>

      {/* EPC List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 font-bold gap-2">
            <FiLoader className="animate-spin text-blue-600" size={24} /> Loading onboarded EPC buyers...
          </div>
        ) : buyers.length === 0 ? (
          <div className="py-20 text-center text-slate-600 text-sm font-semibold space-y-2">
            <div>No EPC buyers onboarded yet.</div>
            <p className="text-xs text-slate-400 font-normal">Click "Register New EPC Buyer" to onboard client sub-accounts with GST validation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Company / EPC Name</th>
                  <th className="text-left text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Contact Person</th>
                  <th className="text-left text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Email</th>
                  <th className="text-left text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">WhatsApp</th>
                  <th className="text-center text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">GSTIN</th>
                  <th className="text-center text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Admin Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {buyers.map((b) => (
                  <tr key={b.id || b._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-900">{b.company_name || b.name}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{b.name}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium"><FiMail className="inline mr-1.5 text-slate-400" size={14} /> {b.email}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium"><FiPhone className="inline mr-1.5 text-slate-400" size={14} /> {b.whatsapp}</td>
                    <td className="px-6 py-4 text-center font-mono text-xs font-bold text-slate-700">{b.gstin || '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold capitalize ${
                        b.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : b.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {b.status === 'approved' ? <FiCheckCircle size={13} /> : b.status === 'pending' ? <FiClock size={13} /> : <FiXCircle size={13} />}
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GST-First Registration Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-300 p-6 sm:p-8 w-full max-w-xl space-y-6 shadow-2xl relative">
            <button onClick={() => setModal(false)} className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <FiX size={20} />
            </button>

            {/* Modal Title & Step Bar */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <FiUsers size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Register EPC Buyer Sub-Account</h3>
                  <p className="text-xs text-slate-500">GST-validated onboarding for client EPC sub-accounts</p>
                </div>
              </div>

              {/* Steps */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {step > 1 ? <FiCheckCircle size={14} /> : 1}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${step >= 1 ? 'text-blue-700' : 'text-slate-400'}`}>
                    GST Verification
                  </span>
                </div>
                <div className={`w-10 h-1 rounded-full ${step > 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    2
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${step >= 2 ? 'text-blue-700' : 'text-slate-400'}`}>
                    EPC Details
                  </span>
                </div>
              </div>
            </div>

            {/* Step 1: GST Verification */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    EPC Buyer GSTIN Number *
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={gstInputRef}
                      type="text"
                      maxLength={15}
                      placeholder="27ABCDE1234F1Z5"
                      value={gstInput}
                      onChange={(e) => {
                        setGstInput(e.target.value.toUpperCase());
                        setGstError("");
                        setGstResult(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyGst()}
                      className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyGst}
                      disabled={gstVerifying}
                      className="py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {gstVerifying ? <FiLoader className="animate-spin" size={16} /> : <><FiShield size={14} /> Verify GST</>}
                    </button>
                  </div>

                  {gstStateName && !gstResult && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <FiMapPin className="text-blue-600" size={13} />
                      State detected: <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{gstStateName}</span>
                    </div>
                  )}

                  {gstError && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                      <FiAlertCircle className="text-red-500 flex-shrink-0" size={16} />
                      <span>{gstError}</span>
                    </div>
                  )}
                </div>

                {gstResult && (
                  <>
                    {/* Case 1: Territory Mismatch */}
                    {gstResult.territory_matched === false ? (
                      <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiXCircle className="text-red-600 flex-shrink-0" size={22} />
                            <span className="text-xs font-black text-red-900 uppercase tracking-wider">
                              ⛔ Territory Mismatch — Registration Blocked
                            </span>
                          </div>
                          <button type="button" onClick={handleResetGst} className="text-xs font-bold text-slate-600 bg-white border border-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer">
                            <FiRefreshCw size={11} /> Change GST
                          </button>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-red-200 space-y-2 text-xs">
                          <p className="font-semibold text-red-800 leading-relaxed">
                            This EPC company's GST is registered in <strong className="underline decoration-red-400 font-bold text-red-900">{gstResult.gst_state_name || "another state"}</strong>, which is <strong>outside your assigned territory boundary</strong>.
                          </p>
                          <div className="pt-2 border-t border-red-100 flex items-center justify-between text-[11px] text-slate-600">
                            <span>Your Authorized Territories:</span>
                            <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              {(gstResult.authorized_territories || []).join(", ") || "Your Territory"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : gstResult.is_unique === false ? (
                      /* Case 2: Duplicate EPC Partner */
                      <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiAlertCircle className="text-amber-600 flex-shrink-0" size={22} />
                            <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                              ⚠️ Duplicate EPC Partner Conflict
                            </span>
                          </div>
                          <button type="button" onClick={handleResetGst} className="text-xs font-bold text-slate-600 bg-white border border-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer">
                            <FiRefreshCw size={11} /> Change GST
                          </button>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-amber-200 text-xs font-semibold text-amber-900">
                          An EPC company with GSTIN <span className="font-mono font-bold text-slate-900">{gstInput}</span> ({gstResult.existing_epc?.company_name || 'Existing Partner'}) is already registered on the platform.
                        </div>
                      </div>
                    ) : (
                      /* Case 3: Success — GST Verified & Territory Matched */
                      <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiCheckCircle className="text-emerald-600 flex-shrink-0" size={22} />
                            <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                              GST Verified & Territory Matched ✓
                            </span>
                          </div>
                          <button type="button" onClick={handleResetGst} className="text-xs font-bold text-slate-600 bg-white border border-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer">
                            <FiRefreshCw size={11} /> Change GST
                          </button>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-2 text-xs">
                          {gstResult.legal_name && (
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-semibold">Legal Name:</span>
                              <span className="font-bold text-slate-900">{gstResult.legal_name}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-semibold">GST Registered State:</span>
                            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{gstResult.gst_state_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-semibold">Territory Validation:</span>
                            <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                              Inside Assigned Boundary ✓
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={() => gstResult && gstResult.territory_matched !== false && gstResult.is_unique !== false && setStep(2)}
                  disabled={!gstResult || gstResult.territory_matched === false || gstResult.is_unique === false}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to EPC Details <FiArrowRight size={18} />
                </button>
              </div>
            )}

            {/* Step 2: EPC Buyer Details Form */}
            {step === 2 && (
              <form onSubmit={handleRegisterEpc} className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-blue-600" size={16} />
                    <span className="font-extrabold text-blue-900">GST: {gstInput}</span>
                    {gstStateName && <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">{gstStateName}</span>}
                  </div>
                  <button type="button" onClick={handleResetGst} className="text-blue-600 font-bold hover:underline">Change</button>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-red-100 text-red-800 text-xs font-bold border border-red-300">{error}</div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company / Firm Name *</label>
                  <div className="relative">
                    <FiBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="Mehta Solar Infra Pvt Ltd"
                      value={form.company_name}
                      onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Person Name *</label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="Sunil Mehta"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email *</label>
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="email"
                        required
                        placeholder="sunil@mehta.in"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp Number *</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="tel"
                        required
                        placeholder="9812345678"
                        value={form.whatsapp}
                        onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {territories.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Authorized Territory *</label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const selected = territories.find(t => String(t.id || t._id) === String(e.target.value));
                        if (selected) {
                          setForm({
                            ...form,
                            state_id: selected.state_id || selected.state?.id || "",
                            district_id: selected.district_id || selected.district?.id || "",
                          });
                        }
                      }}
                    >
                      {territories.map((t) => {
                        const locName = t.location_name || (t.district?.name ? `${t.district.name}, ${t.state?.name || ''}` : t.state?.name || 'Authorized Territory');
                        return (
                          <option key={t.id || t._id} value={t.id || t._id}>
                            {locName} ({t.territory_level || 'district'})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Create Password *</label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModal(false)} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100 cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-extrabold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                    {submitting ? <FiLoader className="animate-spin" size={16} /> : <><FiCheckCircle size={16} /> Submit EPC Buyer</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
