import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUserTie,
  FaArrowLeft,
  FaShieldAlt,
  FaIdCard,
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
} from 'react-icons/fa';
import { bdeApi } from '../../../api/bdeApi';

export default function CreateBde({ moduleUniqueId = 'ADM_BDE_MGMT' }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    bde_id: '',
    mobile_number: '',
    email: '',
    address: '',
    state_id: '',
    state_name: '',
    district_id: '',
    district_name: '',
    joining_date: new Date().toISOString().split('T')[0],
    profile_photo: '',
    // KYC
    aadhaar_number: '',
    aadhaar_document_url: '',
    pan_number: '',
    pan_document_url: '',
    kyc_remarks: '',
    // Credentials
    initial_password: 'Bde@Test1234',
  });

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const res = await bdeApi.getStates();
      setStates(res.states || res.data || []);
    } catch (err) {
      console.error('Failed to fetch states', err);
    }
  };

  const fetchDistricts = async (stateId) => {
    try {
      const res = await bdeApi.getDistricts(stateId);
      setDistricts(res.districts || res.data || []);
    } catch (err) {
      console.error('Failed to fetch districts', err);
    }
  };

  const handleStateChange = (e) => {
    const sId = e.target.value;
    const sObj = states.find(s => (s._id || s.id) === sId);
    setFormData(prev => ({
      ...prev,
      state_id: sId,
      state_name: sObj ? sObj.name : '',
      district_id: '',
      district_name: '',
    }));
    if (sId) {
      fetchDistricts(sId);
    } else {
      setDistricts([]);
    }
  };

  const handleDistrictChange = (e) => {
    const dId = e.target.value;
    const dObj = districts.find(d => (d._id || d.id) === dId);
    setFormData(prev => ({
      ...prev,
      district_id: dId,
      district_name: dObj ? dObj.name : '',
    }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required';
    if (!formData.mobile_number.trim() || !/^[6-9]\d{9}$/.test(formData.mobile_number)) {
      errs.mobile_number = 'Valid 10-digit Indian mobile number is required';
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errs.email = 'Valid email address is required';
    }
    if (!formData.aadhaar_number.trim() || !/^\d{12}$/.test(formData.aadhaar_number)) {
      errs.aadhaar_number = '12-digit Aadhaar number is required';
    }
    if (!formData.pan_number.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number.toUpperCase())) {
      errs.pan_number = 'Valid 10-character PAN number (e.g. ABCDE1234F) is required';
    }
    if (!formData.aadhaar_document_url.trim()) {
      errs.aadhaar_document_url = 'Aadhaar document URL/proof is required';
    }
    if (!formData.pan_document_url.trim()) {
      errs.pan_document_url = 'PAN document URL/proof is required';
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        bde_id: formData.bde_id.trim() || undefined,
        mobile_number: formData.mobile_number.trim(),
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        state_id: formData.state_id || undefined,
        state_name: formData.state_name || undefined,
        district_id: formData.district_id || undefined,
        district_name: formData.district_name || undefined,
        joining_date: formData.joining_date,
        profile_photo: formData.profile_photo.trim() || undefined,
        aadhaar_number: formData.aadhaar_number.trim(),
        aadhaar_document_url: formData.aadhaar_document_url.trim(),
        pan_number: formData.pan_number.trim().toUpperCase(),
        pan_document_url: formData.pan_document_url.trim(),
        kyc_remarks: formData.kyc_remarks.trim() || undefined,
        initial_password: formData.initial_password || 'Bde@Test1234',
      };

      const res = await bdeApi.createBde(payload, moduleUniqueId);
      setSuccess(`BDE profile created successfully with ID: ${res.data?.bde?.bde_id || res.data?.bde_id}`);
      setTimeout(() => {
        navigate('/admin-panel/bde-management/all');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create BDE profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-900 font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin-panel/bde-management/all')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer"
        >
          <FaArrowLeft /> Back to BDE List
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Title Banner */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-slate-50 to-white">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-blue-100 text-[#0575B8] rounded-2xl shadow-xs">
              <FaUserTie className="text-2xl" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Create Business Development Executive</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Register a new BDE field representative with personal details and mandatory KYC verification records.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 text-xs">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5 font-semibold">
              <FaExclamationCircle className="text-lg text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 font-bold">
              <FaCheckCircle className="text-lg text-emerald-600 shrink-0" />
              <span>{success} Redirecting to BDE master list...</span>
            </div>
          )}

          {/* Section 1: Personal Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <FaIdCard className="text-[#0575B8]" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">1. Personal & Employment Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="e.g. Vikram Sharma"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white ${
                    validationErrors.full_name ? 'border-rose-500' : 'border-slate-300'
                  }`}
                />
                {validationErrors.full_name && (
                  <p className="text-[11px] text-rose-600 font-bold">{validationErrors.full_name}</p>
                )}
              </div>

              {/* Custom BDE ID */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                  Employee / BDE ID <span className="text-slate-400 font-normal">(Leave blank to auto-generate)</span>
                </label>
                <input
                  type="text"
                  value={formData.bde_id}
                  onChange={(e) => handleChange('bde_id', e.target.value)}
                  placeholder="Auto-generated e.g. BDE-2026-0001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-[#0575B8] focus:bg-white uppercase"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.mobile_number}
                  onChange={(e) => handleChange('mobile_number', e.target.value)}
                  placeholder="10-digit Indian mobile number (e.g. 9876543210)"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-[#0575B8] focus:bg-white ${
                    validationErrors.mobile_number ? 'border-rose-500' : 'border-slate-300'
                  }`}
                />
                {validationErrors.mobile_number && (
                  <p className="text-[11px] text-rose-600 font-bold">{validationErrors.mobile_number}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="e.g. vikram.bde@solarkits.com"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white ${
                    validationErrors.email ? 'border-rose-500' : 'border-slate-300'
                  }`}
                />
                {validationErrors.email && (
                  <p className="text-[11px] text-rose-600 font-bold">{validationErrors.email}</p>
                )}
              </div>

              {/* Profile Photo URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Profile Photo URL (Optional)</label>
                <input
                  type="url"
                  value={formData.profile_photo}
                  onChange={(e) => handleChange('profile_photo', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#0575B8] focus:bg-white"
                />
              </div>

              {/* Joining Date */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Joining Date *</label>
                <input
                  type="date"
                  required
                  value={formData.joining_date}
                  onChange={(e) => handleChange('joining_date', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white"
                />
              </div>
            </div>

            {/* State & District */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Primary State</label>
                <select
                  value={formData.state_id}
                  onChange={handleStateChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white"
                >
                  <option value="">Select State</option>
                  {states.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Primary District</label>
                <select
                  value={formData.district_id}
                  onChange={handleDistrictChange}
                  disabled={!formData.state_id || districts.length === 0}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0575B8] focus:bg-white disabled:opacity-50"
                >
                  <option value="">Select District</option>
                  {districts.map(d => (
                    <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Residential / Office Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Full address details..."
                rows={2}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#0575B8] focus:bg-white resize-none font-medium"
              />
            </div>
          </div>

          {/* Section 2: KYC Details */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <FaShieldAlt className="text-emerald-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">2. KYC Verification Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Aadhaar Number */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Aadhaar Number (12 Digits) *</label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={formData.aadhaar_number}
                  onChange={(e) => handleChange('aadhaar_number', e.target.value)}
                  placeholder="12-digit Aadhaar number"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-[#0575B8] focus:bg-white ${
                    validationErrors.aadhaar_number ? 'border-rose-500' : 'border-slate-300'
                  }`}
                />
                {validationErrors.aadhaar_number && (
                  <p className="text-[11px] text-rose-600 font-bold">{validationErrors.aadhaar_number}</p>
                )}
              </div>

              {/* PAN Number */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">PAN Number (10 Characters) *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={formData.pan_number}
                  onChange={(e) => handleChange('pan_number', e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-[#0575B8] focus:bg-white uppercase ${
                    validationErrors.pan_number ? 'border-rose-500' : 'border-slate-300'
                  }`}
                />
                {validationErrors.pan_number && (
                  <p className="text-[11px] text-rose-600 font-bold">{validationErrors.pan_number}</p>
                )}
              </div>

              {/* Aadhaar Document URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Aadhaar Document URL *</label>
                <input
                  type="url"
                  required
                  value={formData.aadhaar_document_url}
                  onChange={(e) => handleChange('aadhaar_document_url', e.target.value)}
                  placeholder="https://... (Cloudinary/Storage URL)"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#0575B8] focus:bg-white ${
                    validationErrors.aadhaar_document_url ? 'border-rose-500' : 'border-slate-300'
                  }`}
                />
                {validationErrors.aadhaar_document_url && (
                  <p className="text-[11px] text-rose-600 font-bold">{validationErrors.aadhaar_document_url}</p>
                )}
              </div>

              {/* PAN Document URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">PAN Document URL *</label>
                <input
                  type="url"
                  required
                  value={formData.pan_document_url}
                  onChange={(e) => handleChange('pan_document_url', e.target.value)}
                  placeholder="https://... (Cloudinary/Storage URL)"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#0575B8] focus:bg-white ${
                    validationErrors.pan_document_url ? 'border-rose-500' : 'border-slate-300'
                  }`}
                />
                {validationErrors.pan_document_url && (
                  <p className="text-[11px] text-rose-600 font-bold">{validationErrors.pan_document_url}</p>
                )}
              </div>
            </div>

            {/* KYC Remarks */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">KYC Remarks / Notes (Optional)</label>
              <textarea
                value={formData.kyc_remarks}
                onChange={(e) => handleChange('kyc_remarks', e.target.value)}
                placeholder="Notes for verifier..."
                rows={2}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#0575B8] focus:bg-white resize-none font-medium"
              />
            </div>
          </div>

          {/* Section 3: Initial Credentials */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <FaInfoCircle className="text-[#0575B8]" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">3. Initial Login Credentials</h2>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Default Initial Password</label>
                <input
                  type="text"
                  value={formData.initial_password}
                  onChange={(e) => handleChange('initial_password', e.target.value)}
                  placeholder="e.g. Bde@Test1234"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-[#0575B8]"
                />
                <p className="text-xs text-slate-500 font-medium">
                  The BDE will be required to change this password on their first login. Login will only be active once KYC is verified.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/admin-panel/bde-management/all')}
              className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 rounded-xl bg-[#0575B8] hover:bg-[#045D93] text-white font-bold transition text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating BDE Profile...' : 'Save & Register BDE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
