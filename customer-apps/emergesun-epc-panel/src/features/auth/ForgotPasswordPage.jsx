import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-solar-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Zap size={22} className="text-secondary" />
            </div>
            <div>
              <div className="text-solar-navy font-bold text-xl">Emergesun</div>
              <div className="text-solar-slate text-sm">EPC Management Platform</div>
            </div>
          </div>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-solar-navy mb-2">Check Your Email</h2>
              <p className="text-solar-slate text-sm mb-6">
                We've sent a password reset link to <strong>{email}</strong>. Check your inbox and spam folder.
              </p>
              <Link to="/login" className="btn-primary w-full block text-center">Back to Login</Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-solar-navy mb-1">Forgot Password</h2>
              <p className="text-solar-slate text-sm mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-solar-slate" />
                    <input type="email" className={`input pl-9 ${error ? 'input-error' : ''}`}
                      placeholder="you@company.com" value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }} />
                  </div>
                  {error && <p className="form-error">{error}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <Link to="/login" className="flex items-center justify-center gap-2 mt-4 text-sm text-solar-slate hover:text-primary transition-colors">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
