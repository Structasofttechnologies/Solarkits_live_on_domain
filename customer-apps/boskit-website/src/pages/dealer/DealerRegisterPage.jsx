import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiUsers, FiLock, FiMail, FiPhone, FiMapPin, FiShield, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';

export default function DealerRegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setDealerSession } = useAuth();

  const refCode = searchParams.get('ref') || '';
  const distributorId = searchParams.get('distributor_id') || '';

  const [formData, setFormData] = useState({
    business_name: '',
    contact_person: '',
    email: '',
    mobile: '',
    password: '',
    gst_number: '',
    pan_number: '',
    city: 'Ahmedabad',
    pincode: '380001',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const payload = {
        ...formData,
        distributor_id: distributorId || undefined,
        invite_code: refCode || undefined,
        shop_address: {
          line: `${formData.business_name} Store, Main Road`,
          city: formData.city,
          pincode: formData.pincode,
        },
      };

      const res = await api.post('/dealer/register', payload);

      if (res.data?.success) {
        if (setDealerSession && res.data.dealer) {
          setDealerSession(res.data.dealer);
        }
        navigate('/dealer/portal/dashboard');
      } else {
        setError(res.data?.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration error. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider">
          <FiUsers /> Solar Installer & Dealer Network
        </div>
        <h1 className="font-heading font-black text-3xl text-slate-900">
          Join SolarKits BOS Dealer Network
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Direct factory wholesale equipment pricing, local district depot pickup, and genuine manufacturer warranty backup.
        </p>

        {refCode && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 font-semibold inline-block mt-2">
            Invited via Authorized Distributor Hub (Invite Ref: {refCode})
          </div>
        )}
      </div>

      {/* Registration Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-5 shadow-sm">
        
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
            <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Dealer Business Name *</label>
            <input
              type="text"
              required
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              placeholder="e.g. Apex Solar Energy & Electricals"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Person Name *</label>
              <input
                type="text"
                required
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Proprietor / Partner Name"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Number (WhatsApp) *</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="9876543210"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="dealer@solarpower.in"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Portal Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                maxLength={15}
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                placeholder="24AAACC1206D1ZM"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono uppercase text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">City / District *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Ahmedabad"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50"
          >
            {loading ? 'Registering Dealer Account...' : 'Complete Dealer Registration'} <FiArrowRight />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-600">
          Already registered?{' '}
          <Link to="/auth/login?role=dealer" className="text-blue-700 hover:text-blue-800 font-semibold underline">
            Sign In to Dealer Portal
          </Link>
        </div>

      </div>

    </div>
  );
}
