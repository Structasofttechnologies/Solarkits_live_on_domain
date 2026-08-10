import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-5">
        <ShieldOff size={36} className="text-red-500" />
      </div>
      <h1 className="text-3xl font-bold text-solar-navy mb-2">Access Denied</h1>
      <p className="text-solar-slate mb-2 max-w-md">You don't have permission to access this page. Contact your administrator if you believe this is an error.</p>
      <p className="text-sm text-gray-400 mb-6">Error Code: 403 Forbidden</p>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-outline"><ArrowLeft size={16} /> Go Back</button>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">Dashboard</button>
      </div>
    </div>
  );
}
