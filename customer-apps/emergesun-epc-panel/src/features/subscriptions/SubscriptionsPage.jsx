import React, { useState } from 'react';
import { CreditCard, CheckCircle, ArrowUpCircle, RotateCcw } from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { subscriptionPlans } from '../../mocks/index';
import { companies } from '../../mocks/companies';
import toast from 'react-hot-toast';

export default function SubscriptionsPage() {
  const [selectedCompany, setSelectedCompany] = useState(companies[0]);

  const plan = subscriptionPlans.find((p) => p.name === selectedCompany.subscriptionPlan) || subscriptionPlans[0];
  const expiry = new Date(selectedCompany.subscriptionExpiry);
  const today = new Date();
  const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  const usage = [
    { label: 'Users', used: selectedCompany.totalUsers, total: plan.users === 'Unlimited' ? 1000 : plan.users },
    { label: 'Countries', used: selectedCompany.operatingCountries.length, total: plan.countries === 'Unlimited' ? 20 : plan.countries },
    { label: 'Active Products', used: selectedCompany.activeProducts.length, total: 8 },
  ];

  const billingHistory = [
    { date: '2026-04-01', amount: '$499', plan: selectedCompany.subscriptionPlan, status: 'paid' },
    { date: '2026-03-01', amount: '$499', plan: selectedCompany.subscriptionPlan, status: 'paid' },
    { date: '2026-02-01', amount: '$499', plan: selectedCompany.subscriptionPlan, status: 'paid' },
  ];

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: 'Subscription Plans' }]} />
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-solar-navy">Subscription Plans</h1>
          <p className="text-solar-slate text-sm mt-0.5">Manage company subscriptions and billing</p>
        </div>
        <select className="select text-sm w-56" value={selectedCompany.id}
          onChange={(e) => setSelectedCompany(companies.find((c) => c.id === e.target.value))}>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Current Plan Card */}
      <div className="card p-6 mb-6 bg-gradient-to-br from-primary to-primary-600 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-blue-200 text-sm mb-1">Current Plan</div>
            <h2 className="text-3xl font-bold">{selectedCompany.subscriptionPlan}</h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-blue-200 text-sm">Expires: <span className="text-white font-semibold">{selectedCompany.subscriptionExpiry}</span></div>
              <div className={`text-sm font-bold px-2 py-0.5 rounded-full ${daysLeft < 30 ? 'bg-red-500' : 'bg-green-500'}`}>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => toast.success('Renewal initiated!')} className="flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors">
              <RotateCcw size={15} /> Renew Plan
            </button>
            <button onClick={() => toast.success('Upgrade flow initiated!')} className="flex items-center gap-2 px-4 py-2 bg-secondary text-solar-navy rounded-lg text-sm font-semibold hover:bg-secondary-400 transition-colors">
              <ArrowUpCircle size={15} /> Upgrade
            </button>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {usage.map((u) => {
          const pct = Math.min((u.used / u.total) * 100, 100);
          return (
            <div key={u.label} className="card p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-solar-navy">{u.label}</span>
                <span className="text-sm text-solar-slate">{u.used} / {u.total}</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-400' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xs text-solar-slate mt-1">{pct.toFixed(0)}% used</div>
            </div>
          );
        })}
      </div>

      {/* Plan Comparison */}
      <h2 className="section-title">Available Plans</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {subscriptionPlans.map((p) => (
          <div key={p.id} className={`card p-5 relative ${p.name === selectedCompany.subscriptionPlan ? 'border-primary ring-2 ring-primary' : ''}`}>
            {p.name === selectedCompany.subscriptionPlan && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-0.5 rounded-full">Current</div>
            )}
            <h3 className="font-bold text-solar-navy text-lg mb-0.5">{p.name}</h3>
            <div className="text-2xl font-bold text-primary mb-1">{p.price}<span className="text-sm font-normal text-solar-slate">/mo</span></div>
            <div className="text-xs text-solar-slate mb-3">{p.billingCycle}</div>
            <ul className="space-y-1.5 mb-4">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-xs text-solar-slate">
                  <CheckCircle size={12} className="text-accent flex-shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => toast.success(`${p.name} plan selected!`)}
              className={`w-full btn-sm ${p.name === selectedCompany.subscriptionPlan ? 'btn-outline' : 'btn-primary'}`}>
              {p.name === selectedCompany.subscriptionPlan ? 'Current Plan' : 'Choose Plan'}
            </button>
          </div>
        ))}
      </div>

      {/* Billing History */}
      <h2 className="section-title">Billing History</h2>
      <div className="card overflow-hidden">
        <table className="data-table w-full">
          <thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th>Status</th><th>Invoice</th></tr></thead>
          <tbody>
            {billingHistory.map((b, i) => (
              <tr key={i}>
                <td className="text-sm">{b.date}</td>
                <td className="text-sm">{b.plan}</td>
                <td className="font-semibold text-solar-navy">{b.amount}</td>
                <td><span className="badge-success">Paid</span></td>
                <td><button onClick={() => toast.success('Invoice downloaded!')} className="text-xs text-primary hover:underline">Download</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
