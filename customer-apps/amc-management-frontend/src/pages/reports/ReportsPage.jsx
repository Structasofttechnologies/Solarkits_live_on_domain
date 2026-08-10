// src/pages/reports/ReportsPage.jsx
import { BarChart3, Download, Calendar, FileText, TrendingUp, Zap, DollarSign } from 'lucide-react';
import Button from '../../components/common/Button';
import { AreaChartWidget, BarChartWidget } from '../../components/charts/ChartWidgets';
import { revenueChartData, visitsChartData } from '../../mocks/data';
import { toast } from '../../hooks';

const REPORTS = [
  { id: 1, name: 'AMC Revenue Report', desc: 'Monthly recurring revenue, collection efficiency, outstanding amounts', icon: DollarSign, color: 'bg-success/10 text-success' },
  { id: 2, name: 'Service Visit Report', desc: 'Visit completion rates, technician performance, SLA compliance', icon: Calendar, color: 'bg-info/10 text-info' },
  { id: 3, name: 'Plant Performance Report', desc: 'Generation output, PR, CUF, availability across portfolio', icon: Zap, color: 'bg-solar/10 text-solar' },
  { id: 4, name: 'Renewal & Expiry Report', desc: 'Upcoming renewals, renewal probability, revenue at risk', icon: TrendingUp, color: 'bg-warning/10 text-warning' },
  { id: 5, name: 'Technician Productivity Report', desc: 'Jobs completed, ratings, utilization per technician', icon: FileText, color: 'bg-navy/10 text-navy' },
  { id: 6, name: 'Ticket Resolution Report', desc: 'Open/closed tickets, MTTR, SLA breach analysis, category trends', icon: BarChart3, color: 'bg-danger/10 text-danger' },
  { id: 7, name: 'Cleaning Compliance Report', desc: 'Cleaning schedules adherence, performance gain post-cleaning', icon: Calendar, color: 'bg-purple-100 text-purple-700' },
  { id: 8, name: 'Customer Health Report', desc: 'Customer satisfaction, NPS, churn risk, upgrade opportunities', icon: TrendingUp, color: 'bg-teal-100 text-teal-700' },
];

export default function ReportsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Generate business insights and export data for analysis</p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={() => toast.success('Downloading all reports...')}>
          Download All
        </Button>
      </div>

      {/* Charts Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="card-title mb-4">Revenue Trend (Last 7 Months)</h3>
          <AreaChartWidget
            data={revenueChartData}
            areas={[{ key: 'revenue', name: 'Revenue (₹)', color: '#22A06B' }]}
            height={200}
            formatter={v => `₹${(v / 100000).toFixed(1)}L`}
          />
        </div>
        <div className="card p-5">
          <h3 className="card-title mb-4">Visit Completion Rate</h3>
          <BarChartWidget
            data={visitsChartData}
            bars={[
              { key: 'scheduled', name: 'Scheduled', color: '#9FB3C8' },
              { key: 'completed', name: 'Completed', color: '#22A06B' },
            ]}
            xKey="week"
            height={200}
          />
        </div>
      </div>

      {/* Report Cards */}
      <div>
        <h2 className="text-base font-semibold text-navy mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {REPORTS.map(report => (
            <div key={report.id} className="card hover:shadow-card-md cursor-pointer transition-all hover:border-solar/20 border border-border">
              <div className="p-5">
                <div className={`w-10 h-10 rounded-lg ${report.color} flex items-center justify-center mb-3`}>
                  <report.icon size={20} />
                </div>
                <h3 className="font-semibold text-navy text-sm mb-2">{report.name}</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">{report.desc}</p>
                <div className="flex gap-2">
                  <Button size="xs" variant="outline" onClick={() => toast.info(`Generating ${report.name}...`)}>
                    Generate
                  </Button>
                  <Button size="xs" variant="ghost" leftIcon={<Download size={11} />} onClick={() => toast.success(`Downloading ${report.name}...`)}>
                    Export
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="card p-5">
        <h3 className="card-title mb-4">Scheduled Reports</h3>
        <div className="space-y-3">
          {[
            { name: 'Weekly Visit Summary', schedule: 'Every Monday, 9:00 AM', email: 'rajesh@emergesun.com', active: true },
            { name: 'Monthly Revenue Report', schedule: '1st of every month', email: 'accounts@emergesun.com', active: true },
            { name: 'Renewal Alerts', schedule: 'Every Friday, 10:00 AM', email: 'rajesh@emergesun.com', active: true },
          ].map(r => (
            <div key={r.name} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-gray-50">
              <div>
                <p className="text-sm font-semibold text-navy">{r.name}</p>
                <p className="text-xs text-text-secondary">{r.schedule} → {r.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${r.active ? 'text-success' : 'text-text-muted'}`}>
                  {r.active ? '● Active' : '● Paused'}
                </span>
                <Button size="xs" variant="ghost" onClick={() => toast.info('Editing schedule...')}>Edit</Button>
              </div>
            </div>
          ))}
          <button onClick={() => toast.info('Adding scheduled report...')} className="text-sm text-solar font-medium hover:underline">
            + Add Scheduled Report
          </button>
        </div>
      </div>
    </div>
  );
}
