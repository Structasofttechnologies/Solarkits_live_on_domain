import React, { useState } from 'react';
import { Home, Building, ShoppingCart, Truck, Users, ShieldCheck, CheckCircle2, ChevronRight, BarChart3, Activity } from 'lucide-react';

const tabs = [
  {
    id: 'residential',
    label: 'Residential Solar',
    icon: Home,
    badge: '284 Active Leads',
    title: 'End-to-End Residential Solar Project Lifecycle',
    description: 'Empower field teams and sales agents with roof mapping, instant solar quote generation, site survey tracking, and automated customer handovers.',
    highlights: [
      'Automated site survey & shade analysis dispatch',
      'Instant solar quote generator with utility rate matching',
      'Milestone tracking: Design, Permitting, Installation, Net Metering',
      'Customer digital sign-off and warranty certificate issuing'
    ],
    metrics: [
      { label: 'Surveys Done', val: '196' },
      { label: 'Quotes Sent', val: '143' },
      { label: 'Active Installs', val: '62' },
    ],
    previewBg: 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20',
    color: 'text-amber-500'
  },
  {
    id: 'commercial',
    label: 'Commercial & C&I MW',
    icon: Building,
    badge: '12.4 MW Active',
    title: 'High-Capacity Utility & Industrial Solar Management',
    description: 'Manage complex multi-megawatt commercial contracts, structural engineering reviews, tender documentation, and grid-interconnection timelines.',
    highlights: [
      'Multi-megawatt financial modeling & ROI proposals',
      'Subcontractor dispatch & milestone billing verification',
      'Transformer & grid tie-in readiness checklists',
      'Executive dashboard for portfolio performance monitoring'
    ],
    metrics: [
      { label: 'Site Assessments', val: '98' },
      { label: 'MW Capacity', val: '12.4 MW' },
      { label: 'Active Contracts', val: '45' },
    ],
    previewBg: 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20',
    color: 'text-blue-500'
  },
  {
    id: 'eshop',
    label: 'Solar E-Shop Catalog',
    icon: ShoppingCart,
    badge: 'Integrated Catalog',
    title: 'B2B Wholesale Solar Hardware Store',
    description: 'Procure PV modules, string & hybrid inverters, racking systems, and storage batteries with volume tiered pricing and instant inventory checks.',
    highlights: [
      'Real-time warehouse stock checks across 8 regions',
      'Direct order placement linked to EPC project BOM',
      'Tiered bulk discounts for registered installer networks',
      'Automated delivery status & trackable shipment notifications'
    ],
    metrics: [
      { label: 'Products Listed', val: '1,200+' },
      { label: 'Stock Guarantee', val: '99.8%' },
      { label: 'Avg Fulfillment', val: '< 48 hrs' },
    ],
    previewBg: 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
    color: 'text-emerald-500'
  },
  {
    id: 'procurement',
    label: 'Procurement & Supply Chain',
    icon: Truck,
    badge: 'PO Automation',
    title: 'Centralized Supplier & Inventory Management',
    description: 'Connect EPC procurement teams with global solar manufacturers. Issue purchase orders, track batch serial numbers, and eliminate supply chain bottlenecks.',
    highlights: [
      'Multi-vendor Purchase Order (PO) creation and approval flows',
      'Batch barcode scanning & serial number tracking',
      'Warehouse allocation & dispatch schedule optimization',
      'Custom duties & multi-currency supplier invoice clearance'
    ],
    metrics: [
      { label: 'Active POs', val: '86' },
      { label: 'Suppliers', val: '24 Global' },
      { label: 'Order Accuracy', val: '99.9%' },
    ],
    previewBg: 'bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/20',
    color: 'text-purple-500'
  },
  {
    id: 'crm',
    label: 'Solar CRM & Pipeline',
    icon: Users,
    badge: '+34% Win Rate',
    title: 'Purpose-Built Solar Sales & Deal Management',
    description: 'Turn solar leads into signed contracts. Track lead sources, auto-assign regional reps, log site visits, and forecast monthly solar installations.',
    highlights: [
      'Kanban sales pipeline with custom solar deal stages',
      'Automated WhatsApp, SMS, and Email customer reminders',
      'Sales representative territory management & commission tracking',
      'Lead scoring based on roof size & monthly utility spend'
    ],
    metrics: [
      { label: 'Active Deals', val: '347' },
      { label: 'Avg Cycle', val: '14 Days' },
      { label: 'Close Rate', val: '34%' },
    ],
    previewBg: 'bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-500/20',
    color: 'text-pink-500'
  },
  {
    id: 'rbac',
    label: 'Multi-Country Security & RBAC',
    icon: ShieldCheck,
    badge: 'Enterprise Compliance',
    title: 'Global Multi-Tenant Control & Audit Trail',
    description: 'Enforce rigid data boundaries across multiple operating companies and countries with fine-grained Role-Based Access Control and immutable audit logs.',
    highlights: [
      'Multi-country structure (India, USA, UAE, UK, SA, Germany, etc.)',
      'Pre-configured & custom roles (Super Admin, Country Admin, EPC Ops)',
      'Immutable activity audit logging (user creations, role changes)',
      'Bank-grade encryption & GDPR/SOC2 multi-tenant isolation'
    ],
    metrics: [
      { label: 'Countries Supported', val: '8+' },
      { label: 'Active Roles', val: '12 Preset' },
      { label: 'Audit Trail', val: '100% Logged' },
    ],
    previewBg: 'bg-gradient-to-r from-sky-500/10 to-blue-500/10 border-sky-500/20',
    color: 'text-sky-500'
  }
];

export default function ModuleTabsPreview({ onNavigateLogin }) {
  const [activeTabId, setActiveTabId] = useState('residential');
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  return (
    <div className="space-y-8">
      {/* Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = t.id === activeTabId;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTabId(t.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? 'bg-solar-navy text-white border-solar-navy shadow-md scale-[1.02]'
                  : 'bg-white text-solar-slate border-gray-200 hover:border-solar-blue hover:text-solar-navy'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-secondary' : 'text-solar-slate'} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Details Card */}
      <div className={`rounded-3xl p-6 sm:p-8 bg-white border ${activeTab.previewBg} shadow-xl transition-all duration-300`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Feature Description */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 ${activeTab.color}`}>
                {activeTab.badge}
              </span>
              <span className="text-xs text-solar-slate flex items-center gap-1 font-medium">
                <Activity size={13} className="text-accent" /> Live Module Snapshot
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-solar-navy">{activeTab.title}</h3>
            <p className="text-solar-slate text-sm sm:text-base leading-relaxed">{activeTab.description}</p>

            <div className="space-y-2.5 pt-2">
              {activeTab.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-accent shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-solar-navy">{h}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={onNavigateLogin}
                className="btn-primary py-3 px-6 text-sm font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                Access {activeTab.label} Module <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right Visual Stats & Card Layout */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-solar-navy text-white rounded-2xl p-5 shadow-lg border border-primary-700">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-primary-700">
                <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Module Key Performance Metrics</span>
                <BarChart3 size={16} className="text-secondary" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {activeTab.metrics.map((m, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm p-3 rounded-xl text-center border border-white/10">
                    <div className="text-xl sm:text-2xl font-extrabold text-secondary">{m.val}</div>
                    <div className="text-[11px] text-blue-200 mt-0.5 leading-tight">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel Screen Teaser */}
            <div className="bg-solar-bg rounded-2xl p-5 border border-solar-border space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-solar-slate">
                <span>SYSTEM STATUS</span>
                <span className="text-accent font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping" /> OPERATIONAL
                </span>
              </div>

              <div className="space-y-2">
                <div className="bg-white p-3 rounded-xl border border-solar-border flex justify-between items-center shadow-xs">
                  <div>
                    <div className="text-xs font-bold text-solar-navy">Auto Sync Multi-Currency Engine</div>
                    <div className="text-[11px] text-solar-slate">INR, USD, AED, GBP, ZAR</div>
                  </div>
                  <span className="badge-success">Active</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-solar-border flex justify-between items-center shadow-xs">
                  <div>
                    <div className="text-xs font-bold text-solar-navy">Custom Role Security Guard</div>
                    <div className="text-[11px] text-solar-slate">Country Admin & EPC Manager Isolation</div>
                  </div>
                  <span className="badge-primary">Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
