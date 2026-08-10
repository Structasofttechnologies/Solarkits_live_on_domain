// src/pages/integrations/IntegrationsPage.jsx
import { useState } from 'react';
import { Puzzle, CheckCircle2, Shield, ArrowUpRight, Zap, RefreshCw } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { toast } from '../../hooks';

const INTEGRATION_CATEGORIES = [
  {
    title: 'Solar Monitoring & Dataloggers',
    desc: 'Pull real-time generation, inverter faults, and solar plant data',
    items: [
      { name: 'SolarEdge Monitoring API', category: 'Datalogger', status: 'connected', desc: 'Direct API connection to SolarEdge cloud for power & telemetry', icon: '⚡' },
      { name: 'Sungrow iSolarCloud', category: 'Inverter API', status: 'connected', desc: 'Real-time string and inverter data from Sungrow inverters', icon: '☀️' },
      { name: 'SMA Sunny Portal', category: 'Inverter API', status: 'available', desc: 'SMA Webconnect and Cluster Controller integration', icon: '🔋' },
      { name: 'Growatt ShineServer', category: 'Inverter API', status: 'available', desc: 'Commercial and residential Growatt inverter data sync', icon: '🌐' },
      { name: 'Fronius Solar.web', category: 'Inverter API', status: 'available', desc: 'Fronius Smart Meter and Symo/Primo inverter telemetry', icon: '🔌' },
      { name: 'Huawei FusionSolar', category: 'Inverter API', status: 'connected', desc: 'Huawei SUN2000 smart string inverter & SmartLogger sync', icon: '📡' },
    ]
  },
  {
    title: 'ERP & Accounting Systems',
    desc: 'Sync AMC invoices, customer ledgers, and inventory',
    items: [
      { name: 'Tally Prime Cloud', category: 'Accounting', status: 'connected', desc: 'Auto-sync AMC invoices, receipt vouchers, and GST data', icon: '📊' },
      { name: 'Zoho Books / ERP', category: 'Finance', status: 'available', desc: 'Bi-directional sync of recurring AMC invoices and customer master', icon: '💼' },
      { name: 'SAP S/4HANA Solar', category: 'Enterprise ERP', status: 'coming_soon', desc: 'Enterprise asset management and financial accounting sync', icon: '🏢' },
    ]
  },
  {
    title: 'Communication & SMS Gateways',
    desc: 'Send automated WhatsApp reminders, SMS alerts, and email reports',
    items: [
      { name: 'WhatsApp Business API', category: 'Messaging', status: 'connected', desc: 'Automated visit reminders, ticket updates, and invoice PDFs on WhatsApp', icon: '💬' },
      { name: 'Twilio SMS Gateway', category: 'SMS', status: 'connected', desc: 'SMS alerts for technician dispatches and customer service updates', icon: '📱' },
      { name: 'SendGrid Email Service', category: 'Email', status: 'connected', desc: 'Transactional emails for contract renewals and service reports', icon: '✉️' },
    ]
  },
  {
    title: 'Payment Gateways',
    desc: 'Collect recurring AMC payments via UPI, NetBanking, and Cards',
    items: [
      { name: 'Razorpay AutoPay', category: 'Payment Gateway', status: 'connected', desc: 'UPI Autopay and e-Mandate for recurring AMC subscription billing', icon: '💳' },
      { name: 'Cashfree Payments', category: 'Payment Gateway', status: 'available', desc: 'Instant UPI links and subscription collection for EPC AMC plans', icon: '💸' },
    ]
  }
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(INTEGRATION_CATEGORIES);

  const toggleConnection = (catIndex, itemIndex) => {
    const updated = [...integrations];
    const current = updated[catIndex].items[itemIndex].status;
    const next = current === 'connected' ? 'available' : 'connected';
    updated[catIndex].items[itemIndex].status = next;
    setIntegrations(updated);
    toast.success(`${updated[catIndex].items[itemIndex].name} is now ${next}!`);
  };

  return (
    <div className="page-container max-w-6xl">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Puzzle size={22} className="text-solar" />
            Integrations & API Connections
          </h1>
          <p className="page-subtitle">Connect Emergesun AMC Cloud with solar monitoring portals, ERP, accounting, and messaging services</p>
        </div>
        <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={() => toast.success('API Connections synced')}>
          Sync All APIs
        </Button>
      </div>

      <div className="space-y-8">
        {integrations.map((cat, catIdx) => (
          <div key={cat.title} className="space-y-4">
            <div className="border-b border-border pb-2">
              <h2 className="text-lg font-bold text-navy">{cat.title}</h2>
              <p className="text-xs text-text-secondary">{cat.desc}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.items.map((item, itemIdx) => (
                <div
                  key={item.name}
                  className="card p-5 border border-border hover:shadow-card-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-navy/5 border border-border flex items-center justify-center text-xl shrink-0">
                        {item.icon}
                      </div>
                      <Badge status={item.status} size="xs" dot />
                    </div>

                    <h3 className="font-bold text-navy text-sm leading-snug">{item.name}</h3>
                    <span className="text-xxs font-semibold uppercase tracking-wider text-text-muted bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-1 mb-2">
                      {item.category}
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed mb-4">{item.desc}</p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xxs font-mono text-text-muted">
                      {item.status === 'connected' ? '● Sync Active' : '● Disconnected'}
                    </span>
                    {item.status !== 'coming_soon' && (
                      <Button
                        size="xs"
                        variant={item.status === 'connected' ? 'outline-danger' : 'primary'}
                        onClick={() => toggleConnection(catIdx, itemIdx)}
                      >
                        {item.status === 'connected' ? 'Disconnect' : 'Connect'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
