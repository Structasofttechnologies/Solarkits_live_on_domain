import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="text-8xl font-black text-gray-100 mb-4">404</div>
      <AlertCircle size={48} className="text-solar-slate mb-4" />
      <h1 className="text-2xl font-bold text-solar-navy mb-2">Page Not Found</h1>
      <p className="text-solar-slate mb-6">The page you're looking for doesn't exist or has been moved.</p>
      <button onClick={() => navigate('/dashboard')} className="btn-primary"><Home size={16} /> Back to Dashboard</button>
    </div>
  );
}
