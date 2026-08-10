import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';

const checkStrength = (pw) => {
  let score = 0;
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[!@#$%^&*]/.test(pw),
  };
  score = Object.values(checks).filter(Boolean).length;
  return { checks, score, label: ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][score] };
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const strength = checkStrength(form.password);

  const strengthColors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-accent'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.password) errs.password = 'New password required';
    else if (strength.score < 3) errs.password = 'Password is too weak';
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-solar-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Zap size={22} className="text-secondary" />
            </div>
            <span className="text-solar-navy font-bold text-xl">Emergesun</span>
          </div>
        </div>
        <div className="card p-8">
          {done ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-solar-navy mb-2">Password Reset!</h2>
              <p className="text-solar-slate text-sm mb-6">Your password has been updated. You can now log in with your new password.</p>
              <Link to="/login" className="btn-primary w-full block text-center">Back to Login</Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-solar-navy mb-1">Reset Password</h2>
              <p className="text-solar-slate text-sm mb-6">Create a strong new password for your account.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                      placeholder="Enter new password" value={form.password}
                      onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setErrors((er) => ({ ...er, password: '' })); }} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-solar-slate">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength.score ? strengthColors[strength.score] : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-solar-slate">{strength.label}</p>
                    </div>
                  )}
                  {errors.password && <p className="form-error">{errors.password}</p>}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                  {Object.entries({ length: '8+ characters', upper: 'Uppercase letter', lower: 'Lowercase letter', number: 'Number', special: 'Special character (!@#$%)' }).map(([key, label]) => (
                    <div key={key} className={`flex items-center gap-2 ${strength.checks[key] ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle size={12} /> {label}
                    </div>
                  ))}
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input type="password" className={`input ${errors.confirm ? 'input-error' : ''}`}
                    placeholder="Confirm new password" value={form.confirm}
                    onChange={(e) => { setForm((f) => ({ ...f, confirm: e.target.value })); setErrors((er) => ({ ...er, confirm: '' })); }} />
                  {errors.confirm && <p className="form-error">{errors.confirm}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading ? 'Resetting...' : 'Reset Password'}
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
