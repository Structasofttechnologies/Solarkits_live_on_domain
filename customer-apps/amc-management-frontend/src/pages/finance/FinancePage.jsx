// src/pages/finance/FinancePage.jsx
import { DollarSign, TrendingUp, AlertTriangle, FileText, Plus } from 'lucide-react';
import Button from '../../components/common/Button';
import { AreaChartWidget, PieChartWidget } from '../../components/charts/ChartWidgets';
import { invoices, contracts } from '../../mocks/data';
import { formatCurrency } from '../../utils/formatters';
import { toast } from '../../hooks';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/common/Badge';

const revenueTrend = [
  { month: 'Jul', revenue: 1280000, collected: 1180000 },
  { month: 'Aug', revenue: 1340000, collected: 1220000 },
  { month: 'Sep', revenue: 1420000, collected: 1380000 },
  { month: 'Oct', revenue: 1560000, collected: 1490000 },
  { month: 'Nov', revenue: 1480000, collected: 1420000 },
  { month: 'Dec', revenue: 1640000, collected: 1580000 },
  { month: 'Jan', revenue: 1860000, collected: 1710000 },
];

const billingBreakdown = [
  { name: 'Annual Upfront', value: 45, color: '#0B3A53' },
  { name: 'Quarterly', value: 30, color: '#2878C8' },
  { name: 'Monthly', value: 20, color: '#F9B233' },
  { name: 'Semi-Annual', value: 5, color: '#9FB3C8' },
];

export default function FinancePage() {
  const navigate = useNavigate();
  const totalRevenue = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const collected = invoices.filter(i => i.paymentStatus === 'paid').reduce((s, i) => s + i.totalAmount, 0);
  const overdue = invoices.filter(i => i.paymentStatus === 'overdue').reduce((s, i) => s + i.totalAmount, 0);
  const pending = invoices.filter(i => i.paymentStatus === 'sent').reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Finance & Billing</h1>
          <p className="page-subtitle">Manage AMC invoicing, collections, and recurring revenue</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/invoices')}>View Invoices</Button>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => toast.info('Creating invoice...')}>
            Create Invoice
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Billed (MTD)', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-navy', bg: 'bg-navy/10' },
          { label: 'Collected', value: formatCurrency(collected), icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Outstanding', value: formatCurrency(overdue + pending), icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Overdue', value: formatCurrency(overdue), icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-lg p-4`}>
            <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center mb-2`}>
              <k.icon size={18} className={k.color} />
            </div>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-text-secondary mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h3 className="card-title mb-4">Revenue vs Collections (₹)</h3>
          <AreaChartWidget
            data={revenueTrend}
            areas={[
              { key: 'revenue', name: 'Billed (₹)', color: '#9FB3C8' },
              { key: 'collected', name: 'Collected (₹)', color: '#22A06B' },
            ]}
            xKey="month"
            height={220}
            formatter={v => `₹${(v / 100000).toFixed(1)}L`}
          />
        </div>
        <div className="card p-5">
          <h3 className="card-title mb-4">Billing Cycle Distribution</h3>
          <PieChartWidget data={billingBreakdown} height={180} innerRadius={50} />
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div className="card-header px-5 py-4">
          <h3 className="card-title flex items-center gap-2">
            <FileText size={16} className="text-navy" />
            Recent Invoices
          </h3>
          <button onClick={() => navigate('/invoices')} className="text-xs text-solar font-medium hover:underline">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                {['Invoice ID', 'Customer', 'Period', 'Amount', 'Status', 'Due Date', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 6).map(inv => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                  <td className="px-4 py-3 text-xs font-mono font-semibold text-solar">{inv.invoiceId}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-navy">{inv.customerName}</p>
                    <p className="text-xs text-text-secondary">{inv.contractId}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{inv.billingPeriod}</td>
                  <td className="px-4 py-3 text-sm font-bold text-navy">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-3"><Badge status={inv.paymentStatus} dot size="xs" /></td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{inv.dueDate}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-solar font-medium hover:underline" onClick={e => { e.stopPropagation(); toast.success('Payment reminder sent!'); }}>
                      Send Reminder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
