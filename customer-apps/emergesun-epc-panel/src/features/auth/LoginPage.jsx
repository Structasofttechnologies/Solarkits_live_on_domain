import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession } from '../../mocks/auth';
import useStore from '../../store/useStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useStore((s) => s.setUser);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
      navigate('/dashboard', { replace: true });
    } else {
      // Redirect to Main EmergeSun Website Login with OTP Screen
      window.location.href = 'http://localhost:5176/login';
    }
  }, [navigate, setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide">Redirecting to EmergeSun OTP Login...</p>
      </div>
    </div>
  );
}
