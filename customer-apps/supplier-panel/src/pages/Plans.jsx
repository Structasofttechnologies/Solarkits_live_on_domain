import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateTier } from "../features/auth.slice";
import PageHeader from "../components/PageHeader";
import { FaRocket, FaCheck, FaTimes, FaCrown, FaUserShield, FaGem, FaArrowRight } from "react-icons/fa";
import Button from "../components/Button";
import { motion } from "framer-motion";

export default function Plans() {
  const { tier: currentTier } = useSelector(state => state.auth_slice);
  const dispatch = useDispatch();
  const [billing, setBilling] = useState('monthly');

  const plans = [
    {
      id: 'basic',
      name: 'Free / Trial',
      price: billing === 'monthly' ? '₹0' : '₹0',
      duration: '/mo',
      desc: 'Ideal for small suppliers starting their digital journey.',
      icon: <FaRocket />,
      color: 'primary',
      features: [
        { name: 'Up to 5 Product Listings', included: true },
        { name: 'Basic Order Management', included: true },
        { name: 'Standard Dashboard', included: true },
        { name: 'Email Support', included: true },
        { name: 'Advanced Analytics', included: false },
        { name: 'Bulk CSV Uploads', included: false },
        { name: 'API Integration', included: false },
      ]
    },
    {
      id: 'verified',
      name: 'Starter / Pro',
      price: billing === 'monthly' ? '₹4,999' : '₹49,999',
      duration: billing === 'monthly' ? '/mo' : '/yr',
      desc: 'Perfect for growing businesses needing bulk tools.',
      icon: <FaUserShield />,
      color: 'success',
      recommended: true,
      features: [
        { name: 'Unlimited Product Listings', included: true },
        { name: 'Bulk Upload & Management', included: true },
        { name: 'Detailed Market Analytics', included: true },
        { name: 'Lead Management System', included: true },
        { name: 'Priority Listings', included: true },
        { name: 'API Integration', included: false },
        { name: 'Dedicated Manager', included: false },
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      duration: '',
      desc: 'Scale your manufacturing with full ecosystem control.',
      icon: <FaCrown />,
      color: 'warning',
      features: [
        { name: 'Full API & Webhook Access', included: true },
        { name: 'Multi-Warehouse Control', included: true },
        { name: 'Advanced Team Permissions', included: true },
        { name: 'White-label Portal', included: true },
        { name: 'ERP Integration Support', included: true },
        { name: 'Dedicated Account Manager', included: true },
        { name: '24/7 Priority Support', included: true },
      ]
    }
  ];

  const handleUpgrade = (tierId) => {
    dispatch(updateTier(tierId));
  };

  return (
    <div className="space-y-12 pb-20">
      <PageHeader 
        title="Growth Infrastructure" 
        subtitle="Choose the infrastructure that matches your business scale. Scale up or down anytime." 
        icon={FaGem}
        actions={
          <div className="flex items-center gap-4 bg-surface p-1.5 rounded-2xl border-2 border-border shadow-sm">
            <button 
              onClick={() => setBilling('monthly')}
              className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${billing === 'monthly' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-text-muted hover:text-text-primary'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBilling('yearly')}
              className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${billing === 'yearly' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-text-muted hover:text-text-primary'}`}
            >
              Yearly <span className="ml-1 text-[8px] opacity-70">(-20%)</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan, idx) => (
          <motion.div 
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`card flex flex-col p-10 bg-surface relative overflow-hidden group ${
              plan.recommended ? 'border-primary ring-4 ring-primary/5' : 'border-border'
            }`}
          >
            {plan.recommended && (
              <div className="absolute top-0 right-0 px-6 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-bl-3xl shadow-lg">
                Most Popular
              </div>
            )}

            <div className="mb-8">
              <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center text-3xl shadow-inner ${
                plan.color === 'primary' ? 'bg-primary/10 text-primary' : 
                plan.color === 'success' ? 'bg-success/10 text-success' : 
                'bg-warning/10 text-warning'
              }`}>
                {plan.icon}
              </div>
              <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">{plan.name}</h3>
              <p className="text-sm font-bold text-text-secondary mt-2 leading-relaxed">
                {plan.desc}
              </p>
            </div>

            <div className="mb-10">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-text-primary tracking-tighter">{plan.price}</span>
                <span className="text-sm font-black text-text-muted uppercase">{plan.duration}</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-12">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border pb-4">Key Features</p>
              {plan.features.map((feature, fIdx) => (
                <div key={fIdx} className="flex items-center gap-4">
                  <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    feature.included ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted opacity-50'
                  }`}>
                    {feature.included ? <FaCheck /> : <FaTimes />}
                  </div>
                  <span className={`text-sm font-semibold ${feature.included ? 'text-text-primary' : 'text-text-muted line-through opacity-50'}`}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>

            <Button 
              variant={plan.recommended ? 'primary' : 'outline-primary'} 
              fullWidth 
              className={`h-16 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 ${
                currentTier === plan.id ? 'bg-success! border-success! text-white! cursor-default' : 'group-hover:scale-[1.02]'
              }`}
              onClick={() => handleUpgrade(plan.id)}
              disabled={currentTier === plan.id}
            >
              {currentTier === plan.id ? 'Current Plan' : 'Select Strategy'}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Feature Comparison Mini-Table */}
      <div className="card bg-surface border-border p-10">
        <h4 className="text-xl font-black text-text-primary uppercase tracking-tight mb-8">Infrastructure Comparison</h4>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="text-left py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border">Core Module</div>
          <div className="py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border">Trial</div>
          <div className="py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border">Pro</div>
          <div className="py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border">Enterprise</div>

          {['Product Uploads', 'Analytics Depth', 'API Access', 'Lead Generation'].map((mod, mIdx) => (
            <React.Fragment key={mIdx}>
              <div className="text-left py-6 text-sm font-bold text-text-primary border-b border-border/50">{mod}</div>
              <div className="py-6 text-xs font-black text-text-secondary border-b border-border/50 uppercase">{mIdx === 0 ? '5 Fixed' : 'Basic'}</div>
              <div className="py-6 text-xs font-black text-primary border-b border-border/50 uppercase">{mIdx === 0 ? 'Unlimited' : 'Advanced'}</div>
              <div className="py-6 text-xs font-black text-warning border-b border-border/50 uppercase">Unlimited+</div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
