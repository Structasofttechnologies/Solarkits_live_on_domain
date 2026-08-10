import React from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';

export default function SessionExpiredModal() {
  const { sessionExpired, setSessionExpired, logout } = useStore();
  const navigate = useNavigate();

  if (!sessionExpired) return null;

  const handleLogin = () => {
    logout();
    setSessionExpired(false);
    window.location.href = 'http://localhost:5173/login';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center animate-fade-in">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⏰</span>
        </div>
        <h2 className="text-lg font-bold text-solar-navy mb-2">Session Expired</h2>
        <p className="text-sm text-solar-slate mb-6">
          Your session has expired due to inactivity. Please log in again to continue.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setSessionExpired(false)} className="btn-outline flex-1">Cancel</button>
          <button onClick={handleLogin} className="btn-primary flex-1">Log in Again</button>
        </div>
      </div>
    </div>
  );
}
