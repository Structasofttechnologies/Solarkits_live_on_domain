// src/pages/contracts/ContractDetailPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Send, RefreshCw, XCircle, CheckCircle2, Edit, AlertTriangle } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { contracts, customers, sites, amcPlans } from '../../mocks/data';
import { formatDate, formatCurrency, formatCapacity } from '../../utils/formatters';
import { toast } from '../../hooks';

const TABS = ['Contract Summary', 'Service Coverage', 'Visit Calendar', 'Payment Schedule', 'Invoice History', 'Activity'];

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Contract Summary');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const contract = contracts.find(c => c.id === id) || contracts[0];
  const customer = customers.find(c => c.id === contract.customerId);
  const site = sites.find(s => s.id === contract.siteId);
  const plan = amcPlans.find(p => p.id === contract.planId);

  const handleAction = async (action) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    toast.success(`Contract ${action} successfully!`);
  };

  return (
    <div className="page-container">
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate('/contracts')} className="p-2 rounded-lg hover:bg-gray-100 text-text-secondary">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-navy">{contract.contractId}</h1>
            <Badge status={contract.status} dot />
            {contract.renewalStatus === 'due_soon' && <Badge status="expiring" label="Renewal Due" />}
          </div>
          <p className="text-sm text-text-secondary mt-0.5">{contract.planName} • {contract.customerName}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={() => toast.info('Downloading agreement...')}>
            Download
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Send size={14} />} onClick={() => toast.success('Renewal reminder sent!')}>
            Send Reminder
          </Button>
          <Button variant="success" size="sm" leftIcon={<RefreshCw size={14} />} onClick={() => handleAction('renewed')}>
            Renew
          </Button>
          <Button variant="outline-danger" size="sm" leftIcon={<XCircle size={14} />} onClick={() => setShowCancelDialog(true)}>
            Cancel
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Contract Value', value: formatCurrency(contract.contractValue), color: 'text-navy', bg: 'bg-navy/5' },
          { label: 'Capacity Covered', value: formatCapacity(contract.capacity), color: 'text-solar', bg: 'bg-solar/5' },
          { label: 'Payment Status', value: contract.paymentStatus.charAt(0).toUpperCase() + contract.paymentStatus.slice(1), color: contract.paymentStatus === 'paid' ? 'text-success' : 'text-warning', bg: contract.paymentStatus === 'paid' ? 'bg-success/5' : 'bg-warning/5' },
          { label: 'Days Remaining', value: '55 days', color: 'text-warning', bg: 'bg-warning/5' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-lg p-4`}>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-text-secondary mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="tab-bar px-5">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item ${activeTab === tab ? 'active' : ''}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="p-5">
          {activeTab === 'Contract Summary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-navy mb-3">Contract Details</h3>
                <div className="space-y-2">
                  {[
                    ['Contract ID', contract.contractId],
                    ['AMC Plan', contract.planName],
                    ['Start Date', formatDate(contract.startDate)],
                    ['End Date', formatDate(contract.endDate)],
                    ['Contract Value', formatCurrency(contract.contractValue)],
                    ['Billing Cycle', plan?.billing || 'Quarterly'],
                    ['Payment Status', contract.paymentStatus],
                    ['Status', contract.status],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-border last:border-0">
                      <span className="text-sm text-text-secondary">{label}</span>
                      <span className="text-sm font-semibold text-navy capitalize">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy mb-3">Customer & Site</h3>
                <div className="space-y-3 mb-6">
                  <div className="p-3 rounded-lg bg-gray-50 border border-border cursor-pointer hover:border-solar/20" onClick={() => navigate(`/customers/${contract.customerId}`)}>
                    <p className="text-xs text-text-muted">Customer</p>
                    <p className="font-semibold text-navy text-sm">{contract.customerName}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border border-border cursor-pointer hover:border-solar/20" onClick={() => navigate(`/sites/${contract.siteId}`)}>
                    <p className="text-xs text-text-muted">Solar Site</p>
                    <p className="font-semibold text-navy text-sm">{contract.siteName}</p>
                    <p className="text-xs text-text-secondary">{formatCapacity(contract.capacity)}</p>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-navy mb-3">SLA Terms</h3>
                <div className="space-y-2">
                  {[
                    ['Response Time', plan?.sla?.response || '8 hours'],
                    ['Resolution Time', plan?.sla?.resolution || '48 hours'],
                    ['PM Visits/Year', plan?.visitFrequency || '4 visits/year'],
                    ['Cleaning Visits/Year', plan?.cleaningFrequency || '6 visits/year'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-border last:border-0">
                      <span className="text-sm text-text-secondary">{label}</span>
                      <span className="text-sm font-semibold text-navy">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Service Coverage' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-navy mb-3">Services Included in this Contract</p>
              {(plan?.services || ['Preventive Maintenance', 'Panel Cleaning', 'Remote Monitoring']).map(svc => (
                <div key={svc} className="flex items-center gap-3 p-3 rounded-lg bg-success-50 border border-success/20">
                  <CheckCircle2 size={16} className="text-success shrink-0" />
                  <span className="text-sm font-medium text-navy">{svc}</span>
                </div>
              ))}
              <div className="mt-4 p-3 bg-danger-50 border border-danger/20 rounded-lg">
                <p className="text-sm font-semibold text-navy mb-2 flex items-center gap-2">
                  <XCircle size={15} className="text-danger" /> Exclusions
                </p>
                {['Damage due to natural disasters', 'Theft or vandalism', 'Grid-side issues', 'Module replacements (beyond warranty)'].map(ex => (
                  <p key={ex} className="text-xs text-text-secondary ml-6 py-0.5">{ex}</p>
                ))}
              </div>
            </div>
          )}

          {['Visit Calendar', 'Payment Schedule', 'Invoice History', 'Activity'].includes(activeTab) && (
            <div className="py-12 text-center">
              <AlertTriangle size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-muted">{activeTab} data loaded from API in production</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={() => { handleAction('cancelled'); setShowCancelDialog(false); }}
        title="Cancel Contract"
        message={`Are you sure you want to cancel contract ${contract.contractId}? This will stop all scheduled services and cannot be undone easily.`}
        confirmText="Yes, Cancel Contract"
        loading={loading}
      />
    </div>
  );
}
