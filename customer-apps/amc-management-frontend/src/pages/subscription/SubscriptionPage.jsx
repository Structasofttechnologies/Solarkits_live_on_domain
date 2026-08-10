// src/pages/subscription/SubscriptionPage.jsx
import { Check, Zap, Shield, Star, CreditCard } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { toast } from '../../hooks';

const PLANS = [
  {
    name: 'Starter EPC',
    price: '₹2,999',
    period: 'per month',
    sites: 'Up to 50 Solar Sites',
    features: [
      'Basic Customer & Site Management',
      'Contract Renewal Tracking',
      'Visit Scheduling & Dispatch',
      'Standard Reports',
      '2 Field Technician Logins',
    ],
    buttonText: 'Current Plan',
    current: false,
  },
  {
    name: 'Professional EPC',
    price: '₹7,999',
    period: 'per month',
    sites: 'Up to 250 Solar Sites',
    popular: true,
    features: [
      'Everything in Starter',
      'Remote Monitoring API Integrations',
      'Panel Cleaning Scheduling & Efficiency Tracking',
      'AI Fault Detection & Energy Loss Analytics',
      'Tally & WhatsApp Integration',
      '10 Field Technician Logins',
    ],
    buttonText: 'Active Plan',
    current: true,
  },
  {
    name: 'Enterprise Cloud',
    price: '₹18,999',
    period: 'per month',
    sites: 'Unlimited Solar Sites',
    features: [
      'Everything in Professional',
      'Multi-Branch & Multi-Tenant Support',
      'Dedicated Account Manager & 99.9% Uptime SLA',
      'Custom API & ERP Connectors (SAP/Oracle)',
      'Customer Self-Service Portal & Mobile Apps',
      'Unlimited Technicians & Users',
    ],
    buttonText: 'Upgrade to Enterprise',
    current: false,
  },
];

export default function SubscriptionPage() {
  return (
    <div className="page-container max-w-6xl">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Zap size={22} className="text-solar" />
            SaaS Plan & Billing
          </h1>
          <p className="page-subtitle">Manage your Emergesun AMC Cloud SaaS subscription, usage limits, and billing details</p>
        </div>
      </div>

      {/* Current Subscription Status */}
      <div className="card p-6 bg-navy text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Professional EPC Plan</h2>
            <Badge status="active" size="xs" />
          </div>
          <p className="text-xs text-navy-300 mt-1">
            Renews automatically on <strong className="text-white">February 15, 2025</strong> • Billed Annually (20% Savings)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-solar">₹79,990 / yr</p>
            <p className="text-xxs text-navy-300">GST included</p>
          </div>
          <Button variant="outline-primary" size="sm" onClick={() => toast.info('Managing billing portal...')}>
            Manage Billing
          </Button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => (
          <div
            key={plan.name}
            className={`card p-6 flex flex-col justify-between border-2 ${
              plan.popular ? 'border-solar shadow-card-md relative' : 'border-border'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-solar text-white text-xxs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular for EPCs
              </span>
            )}
            <div>
              <h3 className="font-bold text-navy text-lg">{plan.name}</h3>
              <p className="text-xs font-semibold text-solar mt-1">{plan.sites}</p>

              <div className="my-4">
                <span className="text-3xl font-extrabold text-navy">{plan.price}</span>
                <span className="text-xs text-text-secondary ml-1">{plan.period}</span>
              </div>

              <div className="space-y-2.5 my-6 border-t border-border pt-4">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={15} className="text-success shrink-0 mt-0.5" />
                    <span className="text-xs text-text-secondary leading-snug">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              fullWidth
              variant={plan.current ? 'secondary' : plan.popular ? 'primary' : 'outline'}
              onClick={() => toast.success(`Switched to ${plan.name} plan`)}
            >
              {plan.buttonText}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
