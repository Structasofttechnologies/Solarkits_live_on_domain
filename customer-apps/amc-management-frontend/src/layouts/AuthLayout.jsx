// src/layouts/AuthLayout.jsx
import { Link } from 'react-router-dom';
import { Sun, ArrowLeft, Globe } from 'lucide-react';

const benefits = [
  { icon: '⚡', title: 'Automate Service Scheduling', desc: 'Plan, assign, and track every maintenance visit automatically' },
  { icon: '📊', title: 'Track Solar Plant Performance', desc: 'Real-time monitoring across your entire portfolio of sites' },
  { icon: '💰', title: 'Improve Renewal Revenue', desc: 'Never miss a renewal with automated reminders and smart workflows' },
  { icon: '👷', title: 'Manage Field Technicians', desc: 'GPS check-in, digital checklists, and job completion in the field' },
];

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-[480px] bg-navy flex-col justify-between p-10 shrink-0">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-solar flex items-center justify-center shadow-md group-hover:bg-solar-600 transition-colors">
            <Sun size={22} className="text-navy-900" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">Emergesun AMC Cloud</p>
            <p className="text-navy-300 text-xs mt-0.5">Solar Lifecycle Management</p>
          </div>
        </Link>

        {/* Headline */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-solar/15 border border-solar/30 rounded-full px-3 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-solar animate-pulse-soft" />
              <span className="text-solar text-xs font-medium">
                Smart Solar AMC Management
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white leading-snug mb-4">
              Turn Every Solar Installation into Recurring AMC Revenue
            </h1>
            <p className="text-navy-300 text-base leading-relaxed">
              India's most comprehensive AMC management platform built specifically for EPC companies managing solar installations.
            </p>
          </div>

          <div className="space-y-4">
            {benefits.map((b) => (
              <div key={b.title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-navy-light/30 flex items-center justify-center text-lg shrink-0">
                  {b.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{b.title}</p>
                  <p className="text-navy-300 text-xs mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-navy-light/30 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-semibold">1,200+ EPC Companies</p>
              <p className="text-navy-300 text-xs mt-0.5">Trust Emergesun AMC Cloud</p>
            </div>
            <div className="flex gap-4">
              {[
                { label: '50,000+', sub: 'Plants' },
                { label: '₹120Cr+', sub: 'AMC Revenue' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-solar font-bold text-base">{s.label}</p>
                  <p className="text-navy-300 text-xxs">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-bg p-6 relative">
        {/* Top Right "Back to AMC Website" Button */}
        <div className="absolute top-6 right-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-navy hover:text-navy-900 bg-white hover:bg-navy-50 px-4 py-2.5 rounded-xl border border-navy-200 shadow-sm transition-all hover:shadow-md"
          >
            <Globe size={15} className="text-solar-900" />
            <span>Go to AMC Website</span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
              <Sun size={18} className="text-solar" />
            </div>
            <span className="font-bold text-navy">Emergesun AMC Cloud</span>
          </Link>

          {children}
        </div>
      </div>
    </div>
  );
}
