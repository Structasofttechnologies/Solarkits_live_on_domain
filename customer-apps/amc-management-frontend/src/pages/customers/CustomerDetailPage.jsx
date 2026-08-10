// src/pages/customers/CustomerDetailPage.jsx
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, Phone, Mail, MapPin, Building2, Star,
  FileText, Activity, MessageSquare, DollarSign, Calendar,
  AlertCircle, CheckCircle2, TrendingUp, Zap, ExternalLink
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { customers, contracts, sites, tickets, invoices } from '../../mocks/data';
import { formatDate, formatCurrency, formatCapacity, formatPhone, getInitials } from '../../utils/formatters';
import { toast } from '../../hooks';
import Drawer from '../../components/common/Drawer';
import { ALL_COUNTRIES } from '../../constants';

const TABS = ['Overview', 'Solar Sites', 'AMC Contracts', 'Service History', 'Invoices', 'Documents', 'Activity'];

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showEditDrawer, setShowEditDrawer] = useState(false);

  const customer = customers.find(c => c.id === id) || customers[0];
  const customerContracts = contracts.filter(c => c.customerId === customer.id);
  const customerSites = sites.filter(s => s.customerId === customer.id);
  const customerTickets = tickets.filter(t => t.customerId === customer.id);
  const customerInvoices = invoices.filter(i => i.customerId === customer.id);

  const planNames = { plan1: 'Basic AMC', plan2: 'Cleaning AMC', plan3: 'Cleaning + Maintenance', plan4: 'Power Generation Warranty' };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/customers')} className="p-2 rounded-lg hover:bg-gray-100 text-text-secondary">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-sm font-bold text-white shrink-0">
              {getInitials(customer.name)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy">{customer.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge status={customer.status === 'expiring_soon' ? 'expiring' : customer.status} dot />
                <span className="text-xs text-text-secondary">{customer.category}</span>
                <span className="text-xs text-text-muted">•</span>
                <span className="text-xs text-text-secondary">{planNames[customer.amcPlan]}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Phone size={14} />} onClick={() => toast.info(`Calling ${customer.contactPerson}...`)}>Call</Button>
          <Button variant="outline" size="sm" leftIcon={<Edit size={14} />} onClick={() => setShowEditDrawer(true)}>Edit</Button>
          <Button size="sm" leftIcon={<Calendar size={14} />} onClick={() => navigate('/schedule')}>Schedule Visit</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Contract Value', value: formatCurrency(customer.totalContractValue), icon: DollarSign, color: 'bg-success/10', textColor: 'text-success' },
          { label: 'Outstanding Amount', value: formatCurrency(customer.outstandingAmount), icon: AlertCircle, color: customer.outstandingAmount > 0 ? 'bg-danger/10' : 'bg-success/10', textColor: customer.outstandingAmount > 0 ? 'text-danger' : 'text-success' },
          { label: 'Open Tickets', value: customer.openTickets, icon: MessageSquare, color: 'bg-warning/10', textColor: 'text-warning' },
          { label: 'Health Score', value: `${customer.healthScore}/100`, icon: TrendingUp, color: 'bg-info/10', textColor: 'text-info' },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${k.color} flex items-center justify-center`}>
                <k.icon size={18} className={k.textColor} />
              </div>
              <div>
                <p className={`text-lg font-bold ${k.textColor}`}>{k.value}</p>
                <p className="text-xs text-text-secondary">{k.label}</p>
              </div>
            </div>
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
          {/* Overview Tab */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-navy mb-3">Contact Information</h3>
                <div className="space-y-3">
                  {[
                    { icon: Building2, label: 'Company', value: customer.name },
                    { icon: Star, label: 'Contact Person', value: customer.contactPerson },
                    { icon: Mail, label: 'Email', value: customer.email },
                    { icon: Phone, label: 'Phone', value: formatPhone(customer.phone) },
                    { icon: MapPin, label: 'Address', value: `${customer.address}, ${customer.city}, ${customer.state}, ${customer.country || 'India'} - ${customer.pincode}` },
                  ].map(item => (

                    <div key={item.label} className="flex items-start gap-3">
                      <item.icon size={15} className="text-text-muted mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-text-secondary">{item.label}</p>
                        <p className="text-sm font-medium text-navy">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-navy mb-3">GST & Tax Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-text-secondary">GST Number</span>
                      <span className="text-xs font-mono font-medium text-navy">{customer.gstNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-text-secondary">PAN Number</span>
                      <span className="text-xs font-mono font-medium text-navy">{customer.panNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-text-secondary">Customer Since</span>
                      <span className="text-xs font-medium text-navy">{formatDate(customer.addedOn)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-navy mb-3">AMC Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: 'AMC Plan', value: planNames[customer.amcPlan] },
                    { label: 'Total Sites', value: `${customer.totalSites} sites` },
                    { label: 'Total Capacity', value: formatCapacity(customer.totalCapacity) },
                    { label: 'Last Service', value: formatDate(customer.lastService) },
                    { label: 'Next Service', value: formatDate(customer.nextService) },
                    { label: 'Renewal Date', value: formatDate(customer.renewalDate) },
                    { label: 'Renewal Probability', value: `${customer.renewalProbability}%` },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                      <span className="text-sm text-text-secondary">{item.label}</span>
                      <span className="text-sm font-semibold text-navy">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-success-50 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={14} className="text-success" />
                    <span className="text-xs font-semibold text-success-700">Customer Health Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white rounded-full">
                      <div className="h-full bg-success rounded-full" style={{ width: `${customer.healthScore}%` }} />
                    </div>
                    <span className="text-sm font-bold text-success-700">{customer.healthScore}%</span>
                  </div>
                </div>

                {customer.notes && (
                  <div className="mt-4 p-3 bg-gray-50 border border-border rounded-lg">
                    <p className="text-xs font-semibold text-navy mb-1">Internal Notes</p>
                    <p className="text-sm text-text-secondary">{customer.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Solar Sites Tab */}
          {activeTab === 'Solar Sites' && (
            <div className="space-y-3">
              {customerSites.length === 0 ? (
                <div className="py-12 text-center">
                  <Zap size={32} className="text-text-muted mx-auto mb-3" />
                  <p className="text-sm font-medium text-navy">No solar sites registered</p>
                  <p className="text-xs text-text-secondary mt-1 mb-4">Add the customer's solar sites to start managing their AMC</p>
                  <Button size="sm" onClick={() => navigate('/sites')}>Add Solar Site</Button>
                </div>
              ) : customerSites.map(site => (
                <div key={site.id} className="p-4 rounded-lg border border-border hover:border-solar/20 cursor-pointer transition-all" onClick={() => navigate(`/sites/${site.id}`)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-solar/10 flex items-center justify-center">
                        <Zap size={18} className="text-solar" />
                      </div>
                      <div>
                        <p className="font-semibold text-navy">{site.name}</p>
                        <p className="text-xs text-text-secondary">{site.city} • {formatCapacity(site.capacity)} • {site.inverterBrand}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge status={site.monitoringStatus} dot />
                      <ExternalLink size={14} className="text-text-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AMC Contracts Tab */}
          {activeTab === 'AMC Contracts' && (
            <div className="space-y-3">
              {customerContracts.map(c => (
                <div key={c.id} className="p-4 rounded-lg border border-border hover:border-solar/20 cursor-pointer transition-all" onClick={() => navigate(`/contracts/${c.id}`)}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-text-muted">{c.contractId}</span>
                        <Badge status={c.status} size="xs" dot />
                      </div>
                      <p className="font-semibold text-navy">{c.planName}</p>
                      <p className="text-xs text-text-secondary">{c.siteName} • {formatCapacity(c.capacity)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-navy">{formatCurrency(c.contractValue)}</p>
                      <p className="text-xs text-text-secondary">{formatDate(c.startDate)} – {formatDate(c.endDate)}</p>
                      <Badge status={c.paymentStatus} size="xs" className="mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'Invoices' && (
            <div className="space-y-3">
              {customerInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                  <div>
                    <p className="font-semibold text-navy text-sm">{inv.invoiceId}</p>
                    <p className="text-xs text-text-secondary">{inv.billingPeriod}</p>
                    <p className="text-xs text-text-muted">Due: {formatDate(inv.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-navy">{formatCurrency(inv.totalAmount)}</p>
                    <Badge status={inv.paymentStatus} size="xs" className="mt-1" />
                  </div>
                </div>
              ))}
              {customerInvoices.length === 0 && <p className="text-center text-sm text-text-muted py-8">No invoices found</p>}
            </div>
          )}

          {/* Other Tabs */}
          {['Service History', 'Documents', 'Activity'].includes(activeTab) && (
            <div className="py-12 text-center">
              <p className="text-sm text-text-muted">{activeTab} — coming soon in full build</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Drawer */}
      <Drawer
        isOpen={showEditDrawer}
        onClose={() => setShowEditDrawer(false)}
        title="Edit Customer"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowEditDrawer(false)}>Cancel</Button>
            <Button onClick={() => { toast.success('Customer updated!'); setShowEditDrawer(false); }}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Customer Name</label>
            <input defaultValue={customer.name} className="form-input" />
          </div>
          <div>
            <label className="form-label">Contact Person</label>
            <input defaultValue={customer.contactPerson} className="form-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Email</label>
              <input defaultValue={customer.email} type="email" className="form-input" />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input defaultValue={customer.phone} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Address</label>
            <textarea defaultValue={customer.address} rows={2} className="form-textarea" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Country</label>
              <select defaultValue={customer.country || 'India'} className="form-select">
                {ALL_COUNTRIES.map(c => (
                  <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">State</label>
              <input defaultValue={customer.state} className="form-input" />
            </div>
            <div>
              <label className="form-label">City</label>
              <input defaultValue={customer.city} className="form-input" />
            </div>
          </div>

          <div>
            <label className="form-label">GST Number</label>
            <input defaultValue={customer.gstNumber} className="form-input" />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea defaultValue={customer.notes} rows={3} className="form-textarea" />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
