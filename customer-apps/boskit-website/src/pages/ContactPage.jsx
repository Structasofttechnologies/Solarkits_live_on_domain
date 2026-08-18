import React, { useState } from 'react';
import { FiPhone, FiMail, FiMapPin, FiSend, FiCheckCircle, FiClock } from 'react-icons/fi';
import api from '../services/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    inquiry_type: 'distributor',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      const res = await api.post('/public/contact', formData);
      if (res.data?.success) {
        setSubmitted(true);
      } else {
        setError(res.data?.message || 'Failed to submit inquiry.');
      }
    } catch (err) {
      setError('Inquiry submission failed. Please try again or call our direct line.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 bg-[#FFFFFF]">
      
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold text-[#0575B8] uppercase tracking-widest bg-[#EFF8FF] px-3 py-1 rounded-full border border-[#E2E8F0]">
          Get In Touch
        </span>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-[#0F172A] tracking-tight">
          Regional Distribution Support Desk
        </h1>
        <p className="text-xs sm:text-sm text-[#475569]">
          Have questions about exclusive territory assignments, bulk container imports, or dealer registrations? Contact our regional desk.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <div className="bg-[#FFFFFF] p-5 rounded-2xl space-y-2 border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center gap-2.5 text-[#0575B8]">
              <FiMapPin className="w-5 h-5" />
              <h4 className="font-heading font-bold text-sm text-[#0F172A]">Central Operations Hub</h4>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              SolarKits BOS Regional Logistics Depot, Sarkhej-Bavla Highway, Ahmedabad, Gujarat 382210, India
            </p>
          </div>

          <div className="bg-[#FFFFFF] p-5 rounded-2xl space-y-2 border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center gap-2.5 text-[#0575B8]">
              <FiPhone className="w-5 h-5" />
              <h4 className="font-heading font-bold text-sm text-[#0F172A]">Partner Direct Lines</h4>
            </div>
            <p className="text-xs text-[#0F172A] font-mono font-bold">+91 (079) 4000-BOSKIT (2675)</p>
            <p className="text-[11px] text-[#475569]">Mon - Sat: 9:30 AM to 6:30 PM IST</p>
          </div>

          <div className="bg-[#FFFFFF] p-5 rounded-2xl space-y-2 border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center gap-2.5 text-[#0575B8]">
              <FiMail className="w-5 h-5" />
              <h4 className="font-heading font-bold text-sm text-[#0F172A]">Departmental Inquiries</h4>
            </div>
            <p className="text-xs text-[#475569]">Distributors: <strong className="text-[#0F172A]">distributors@solarkits.in</strong></p>
            <p className="text-xs text-[#475569]">Commercial Desk: <strong className="text-[#0F172A]">orders@solarkits.in</strong></p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 bg-[#FFFFFF] p-8 rounded-3xl border border-[#E2E8F0] shadow-xs">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#EFF8FF] border border-[#E2E8F0] flex items-center justify-center text-[#0575B8] mx-auto">
                <FiCheckCircle className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-bold text-2xl text-[#0F172A]">Inquiry Received!</h3>
              <p className="text-xs text-[#475569] max-w-md mx-auto">
                Thank you for contacting SolarKits BOS. Our regional distribution director will review your inquiry and connect with you within 24 business hours.
              </p>
              <button
                onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', mobile: '', inquiry_type: 'distributor', subject: '', message: '' }); }}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0575B8] text-white hover:bg-[#045D93]"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-heading font-bold text-lg text-[#0F172A] mb-2">Send Message to Regional Desk</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#0F172A] font-medium block mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-[#475569] focus:outline-none focus:border-[#0575B8] focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#0F172A] font-medium block mb-1.5">Business Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@company.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-[#475569] focus:outline-none focus:border-[#0575B8] focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#0F172A] font-medium block mb-1.5">Mobile Number</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-[#475569] focus:outline-none focus:border-[#0575B8] focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#0F172A] font-medium block mb-1.5">Inquiry Type</label>
                  <select
                    value={formData.inquiry_type}
                    onChange={(e) => setFormData({ ...formData, inquiry_type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0575B8] focus:bg-[#FFFFFF]"
                  >
                    <option value="distributor">Distributor Territory Application</option>
                    <option value="dealer">Local Dealer Account Request</option>
                    <option value="commercial_procurement">Bulk Container Order / C&I</option>
                    <option value="support">Technical & Warranty Support</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#0F172A] font-medium block mb-1.5">Message / Territory Details *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Mention your target district/state, approximate monthly volume, or specific product inquiries..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-[#475569] focus:outline-none focus:border-[#0575B8] focus:bg-[#FFFFFF]"
                />
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-bold bg-[#0575B8] text-white hover:bg-[#045D93] shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                <FiSend className="w-3.5 h-3.5 text-[#F49222]" />
                {submitting ? 'Sending...' : 'Submit Inquiry'}
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
