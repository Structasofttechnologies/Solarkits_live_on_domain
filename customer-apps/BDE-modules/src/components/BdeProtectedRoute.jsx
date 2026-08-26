import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useBdeAuth } from '../context/BdeAuthContext';
import { ShieldCheck, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function BdeProtectedRoute() {
  const { isAuthenticated, user, loading, changePassword } = useBdeAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Verifying BDE session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If first login is required, show mandatory change password modal
  if (user?.is_first_login) {
    const handleFirstPasswordChange = async (e) => {
      e.preventDefault();
      setError(null);

      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setChanging(true);
      try {
        await changePassword('', newPassword);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to update password');
      } finally {
        setChanging(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 md:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl mx-auto flex items-center justify-center border border-amber-200">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">First-Time Login Security Setup</h2>
            <p className="text-xs text-slate-500">
              Welcome, <span className="font-semibold text-slate-700">{user.full_name}</span>. For your account security, please create a new permanent password to continue.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleFirstPasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase">New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase">Confirm Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={changing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {changing ? 'Securing Account...' : 'Set Password & Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
