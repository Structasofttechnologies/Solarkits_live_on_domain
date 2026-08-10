// src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../hooks';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    const result = await login(email, password);
    if (result.success) {
      toast.success('Welcome back! Redirecting to dashboard...');
      navigate('/dashboard');
    } else {
      toast.error(result.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <AuthLayout>
      <div>
        <h2 className="text-2xl font-bold text-navy mb-1">Sign in to your account</h2>
        <p className="text-sm text-text-secondary mb-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-solar font-medium hover:underline">
            Create a free trial
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label className="form-label">Work Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`form-input pl-9 ${errors.email ? 'border-danger focus:border-danger focus:ring-danger/30' : ''}`}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="form-label mb-0">Password</label>
              <Link to="/forgot-password" className="text-xs text-solar hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`form-input pl-9 pr-10 ${errors.password ? 'border-danger' : ''}`}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            <label htmlFor="remember" className="text-sm text-text-secondary cursor-pointer">
              Remember me for 30 days
            </label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            loading={isLoading}
            rightIcon={<ArrowRight size={16} />}
          >
            Sign In
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
