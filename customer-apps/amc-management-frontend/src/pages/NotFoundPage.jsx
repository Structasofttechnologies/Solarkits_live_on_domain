// src/pages/NotFoundPage.jsx
import { Link } from 'react-router-dom';
import { Sun, ArrowLeft, LayoutDashboard } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center mb-6">
        <Sun size={28} className="text-solar" />
      </div>
      <div className="text-8xl font-extrabold text-border mb-4">404</div>
      <h1 className="text-2xl font-bold text-navy mb-2">Page not found</h1>
      <p className="text-text-secondary max-w-sm mb-8">
        The page you're looking for doesn't exist or may have been moved. Let's get you back on track.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.history.back()} leftIcon={<ArrowLeft size={15} />}>
          Go Back
        </Button>
        <Link to="/dashboard">
          <Button leftIcon={<LayoutDashboard size={15} />}>
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
