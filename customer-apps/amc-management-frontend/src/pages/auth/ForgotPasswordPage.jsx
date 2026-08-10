// src/pages/auth/ForgotPasswordPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/common/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

  return (
    <AuthLayout>
      <div>
        <Link to="/login" className="flex items-center gap-2 text-sm text-text-secondary hover:text-navy mb-8 transition-colors">
          <ArrowLeft size={16} />
          Back to Sign In
        </Link>

        {!sent ? (
          <>
            <h2 className="text-2xl font-bold text-navy mb-1">Reset your password</h2>
            <p className="text-sm text-text-secondary mb-8">
              Enter your work email and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Work Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`form-input pl-9 ${error ? 'border-danger' : ''}`}
                    placeholder="you@company.com"
                  />
                </div>
                {error && <p className="form-error">{error}</p>}
              </div>
              <Button type="submit" fullWidth size="lg" loading={loading}>
                Send Reset Link
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-success" />
            </div>
            <h2 className="text-xl font-bold text-navy mb-2">Check your inbox</h2>
            <p className="text-sm text-text-secondary mb-6">
              We've sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.
            </p>
            <p className="text-xs text-text-muted">
              Didn't receive the email?{' '}
              <button onClick={() => setSent(false)} className="text-solar hover:underline font-medium">
                Try again
              </button>
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
