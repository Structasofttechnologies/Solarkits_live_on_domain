// src/pages/auth/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../hooks';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ companyName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.companyName) e.companyName = 'Company name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter valid email';
    if (!form.phone) e.phone = 'Phone is required';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (res.success) {
      toast.success('Trial account created! Let\'s set up your workspace.');
      navigate('/onboarding');
    } else {
      toast.error(res.message || 'Registration failed');
    }
  };

  return (
    <AuthLayout>
      <div>
        <h2 className="text-2xl font-bold text-navy mb-1">Start your free trial</h2>
        <p className="text-sm text-text-secondary mb-8">
          14 days free, no credit card required.{' '}
          <Link to="/login" className="text-solar font-medium hover:underline">
            Already have an account?
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {[
            { label: 'EPC Company Name', field: 'companyName', type: 'text', placeholder: 'Emergesun Energy Pvt. Ltd.' },
            { label: 'Business Email', field: 'email', type: 'email', placeholder: 'you@company.com' },
            { label: 'Phone Number', field: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label className="form-label">{label}</label>
              <input
                type={type}
                value={form[field]}
                onChange={update(field)}
                className={`form-input ${errors[field] ? 'border-danger' : ''}`}
                placeholder={placeholder}
              />
              {errors[field] && <p className="form-error">{errors[field]}</p>}
            </div>
          ))}

          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                className={`form-input pr-10 ${errors.password ? 'border-danger' : ''}`}
                placeholder="Min. 8 characters"
              />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <div>
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              className={`form-input ${errors.confirmPassword ? 'border-danger' : ''}`}
              placeholder="Re-enter password"
            />
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
          </div>

          <p className="text-xs text-text-secondary">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-solar hover:underline">Terms of Service</a> and{' '}
            <a href="#" className="text-solar hover:underline">Privacy Policy</a>.
          </p>

          <Button type="submit" fullWidth size="lg" loading={loading} rightIcon={<ArrowRight size={16} />}>
            Next
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
