import React from "react";
import PageHeader from "../components/PageHeader";
import { FaTags, FaUsers, FaChartLine, FaPlus, FaPercentage, FaArrowRight, FaLock } from "react-icons/fa";
import Button from "../components/Button";
import { motion } from "framer-motion";

export default function PricingTiers() {
  const tiers = [
    { name: 'Standard / Retail', discount: '0%', customers: 450, status: 'Active', color: 'primary' },
    { name: 'Verified EPC Installer', discount: '5% - 12%', customers: 120, status: 'Active', color: 'success' },
    { name: 'B2B Wholesale (Bulk)', discount: '15% - 22%', customers: 28, status: 'Active', color: 'secondary' },
    { name: 'Government Projects', discount: 'Custom', customers: 0, status: 'Draft', color: 'warning' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Intelligent Pricing Tiers" 
        subtitle="Configure dynamic discount structures for different customer segments and purchase volumes." 
        icon={FaTags}
        actions={
          <Button 
            variant="primary" 
            className="rounded-xl font-bold text-xs uppercase tracking-widest h-12 shadow-lg shadow-primary/20 px-8"
            leftIcon={<FaPlus />}
          >
            Create Pricing Rule
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card p-6 bg-surface border-border flex flex-col justify-between group hover:border-primary/30 transition-all"
          >
            <div>
              <div className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center text-xl shadow-inner ${
                tier.color === 'primary' ? 'bg-primary/10 text-primary' : 
                tier.color === 'success' ? 'bg-success/10 text-success' : 
                tier.color === 'secondary' ? 'bg-secondary/10 text-secondary' : 
                'bg-warning/10 text-warning'
              }`}>
                <FaPercentage />
              </div>
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">{tier.name}</h3>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">Average Discount</p>
              <h4 className="text-2xl font-black text-text-primary mt-1 tracking-tight">{tier.discount}</h4>
            </div>

            <div className="mt-8 pt-6 border-t border-border/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FaUsers className="text-text-muted text-xs" />
                <span className="text-[10px] font-black text-text-secondary uppercase">{tier.customers} Segments</span>
              </div>
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${tier.status === 'Active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                {tier.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rule Configurator Placeholder */}
        <div className="lg:col-span-2 card bg-surface border-border p-8 min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-surface-hover border-2 border-border flex items-center justify-center text-3xl text-primary/30 shadow-xl">
            <FaChartLine />
          </div>
          <div className="max-w-md">
            <h4 className="text-2xl font-black text-text-primary uppercase tracking-tight">Tier Performance Engine</h4>
            <p className="text-sm font-semibold text-text-secondary mt-3">
              Visualize how different pricing tiers affect your conversion rates and gross margin. Select a tier to view detailed sales distribution.
            </p>
          </div>
          <Button variant="outline-primary" className="rounded-xl h-12 px-10 font-black uppercase tracking-widest text-xs">
            Analyze Conversions
          </Button>
        </div>

        {/* Global Discounts */}
        <div className="card bg-surface border-border p-8 space-y-8">
          <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Global Modifiers</h3>
          <div className="space-y-6">
            {[
              { label: 'Bulk Order (100+ units)', value: '-5.0%', active: true },
              { label: 'Pre-paid Cash Flow', value: '-2.5%', active: true },
              { label: 'Loyalty Factor', value: '-1.0%', active: false },
            ].map((rule, idx) => (
              <div key={idx} className="flex items-center justify-between group cursor-pointer">
                <div>
                  <p className="text-xs font-black text-text-primary uppercase tracking-tight group-hover:text-primary transition-colors">{rule.label}</p>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Global Modifier</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-black ${rule.active ? 'text-primary' : 'text-text-muted opacity-50'}`}>{rule.value}</span>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${rule.active ? 'bg-primary' : 'bg-border'}`}>
                    <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${rule.active ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4">
            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-center gap-4">
              <FaLock className="text-primary text-sm" />
              <p className="text-[10px] font-bold text-text-secondary leading-tight">
                Some modifiers are managed by platform <span className="font-black text-primary">Global Governance</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
