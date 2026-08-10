// src/pages/dashboard/DashboardPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileText, DollarSign, RefreshCw, Calendar, MessageSquare,
  Activity, Zap, Clock, AlertTriangle, ArrowRight, ChevronRight,
  TrendingUp, CheckCircle2, BarChart3
} from 'lucide-react';
import KPICard from '../../components/dashboard/KPICard';
import { AreaChartWidget, BarChartWidget, PieChartWidget } from '../../components/charts/ChartWidgets';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  dashboardKPIs, revenueChartData, visitsChartData,
  ticketStatusData, contractsByPlanData, plantPerformanceData,
  visits, tickets, contracts, aiInsights,
} from '../../mocks/data';
import { formatCurrency, formatDate, formatCapacity } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../hooks';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [revenueView, setRevenueView] = useState('revenue');

  const firstName = user?.name?.split(' ')[0] || 'Rajesh';
  const todayVisits = visits.filter(v => v.scheduledDate === '2024-02-05').slice(0, 4);
  const openTickets = tickets.filter(t => !['resolved', 'closed'].includes(t.status)).slice(0, 5);
  const expiringContracts = contracts.filter(c => c.renewalStatus === 'due_soon').slice(0, 4);
  const criticalInsights = aiInsights.filter(a => ['critical', 'high'].includes(a.severity)).slice(0, 3);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Here is what is happening across your AMC operations today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<BarChart3 size={14} />}
            onClick={() => navigate('/reports')}
          >
            View Reports
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Calendar size={14} />}
            onClick={() => navigate('/schedule')}
          >
            Schedule Visit
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title="Total AMC Customers"
          value={dashboardKPIs.totalCustomers.value}
          trend={dashboardKPIs.totalCustomers.trend}
          trendLabel="vs last month"
          icon={Users}
          iconBg="bg-info/10"
          iconColor="text-info"
          onClick={() => navigate('/customers')}
          tooltip="Total customers with at least one AMC contract"
        />
        <KPICard
          title="Active Contracts"
          value={dashboardKPIs.activeContracts.value}
          trend={dashboardKPIs.activeContracts.trend}
          trendLabel="vs last quarter"
          icon={FileText}
          iconBg="bg-navy/10"
          iconColor="text-navy"
          onClick={() => navigate('/contracts')}
          tooltip="Contracts currently in Active status"
        />
        <KPICard
          title="Monthly AMC Revenue"
          value="₹18.6L"
          trend={dashboardKPIs.monthlyRevenue.trend}
          trendLabel="vs last month"
          icon={DollarSign}
          iconBg="bg-success/10"
          iconColor="text-success"
          onClick={() => navigate('/finance')}
          tooltip="Total recurring AMC revenue billed this month"
          highlight
        />
        <KPICard
          title="Renewals Due"
          value={dashboardKPIs.renewalsDue.value}
          trend={dashboardKPIs.renewalsDue.trend}
          trendLabel="vs last month"
          icon={RefreshCw}
          iconBg="bg-warning/10"
          iconColor="text-warning"
          onClick={() => navigate('/contracts')}
          tooltip="Contracts expiring in next 90 days"
        />
        <KPICard
          title="Visits Scheduled Today"
          value={dashboardKPIs.visitsToday.value}
          trend={dashboardKPIs.visitsToday.trend}
          trendLabel="vs yesterday"
          icon={Calendar}
          iconBg="bg-solar/10"
          iconColor="text-solar"
          onClick={() => navigate('/schedule')}
          tooltip="Total service visits scheduled for today"
        />
        <KPICard
          title="Open Service Tickets"
          value={dashboardKPIs.openTickets.value}
          trend={dashboardKPIs.openTickets.trend}
          trendLabel="vs last week"
          icon={MessageSquare}
          iconBg="bg-danger/10"
          iconColor="text-danger"
          onClick={() => navigate('/tickets')}
          tooltip="Tickets in New, Assigned, In Progress, or Escalated status"
        />
        <KPICard
          title="Plants Under Monitoring"
          value={dashboardKPIs.plantsMonitored.value}
          trend={dashboardKPIs.plantsMonitored.trend}
          trendLabel="vs last quarter"
          icon={Activity}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          onClick={() => navigate('/monitoring')}
          tooltip="Solar sites with active remote monitoring"
        />
        <KPICard
          title="Avg Plant Availability"
          value={dashboardKPIs.avgAvailability.value}
          trend={dashboardKPIs.avgAvailability.trend}
          trendLabel="vs last month"
          icon={Zap}
          iconBg="bg-success/10"
          iconColor="text-success"
          suffix="%"
          onClick={() => navigate('/monitoring')}
          tooltip="Average availability across all monitored plants"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <div>
              <h3 className="card-title">AMC Revenue Trend</h3>
              <p className="text-xs text-text-secondary mt-0.5">Monthly recurring revenue (Jul 2023 – Jan 2024)</p>
            </div>
            <div className="flex gap-1">
              {['revenue', 'contracts'].map(v => (
                <button
                  key={v}
                  onClick={() => setRevenueView(v)}
                  className={[
                    'px-3 py-1 rounded text-xs font-medium transition-colors capitalize',
                    revenueView === v ? 'bg-solar text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200',
                  ].join(' ')}
                >
                  {v === 'revenue' ? 'Revenue' : 'Contracts'}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <AreaChartWidget
              data={revenueChartData}
              areas={[{
                key: revenueView,
                name: revenueView === 'revenue' ? 'Revenue (₹)' : 'Active Contracts',
                color: revenueView === 'revenue' ? '#22A06B' : '#2878C8',
              }]}
              height={220}
              formatter={(v, name) => name === 'Revenue (₹)' ? `₹${(v/100000).toFixed(1)}L` : v}
            />
          </div>
        </div>

        {/* Contracts by Plan */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Contracts by Plan</h3>
            <button onClick={() => navigate('/amc-plans')} className="text-xs text-solar font-medium hover:underline">
              View Plans
            </button>
          </div>
          <div className="card-body">
            <PieChartWidget data={contractsByPlanData} height={180} innerRadius={45} />
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Total Contracts</span>
                <span className="font-bold text-navy">1,086</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Visits Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Visits — Scheduled vs Completed</h3>
            <span className="text-xs text-text-secondary">Last 4 weeks</span>
          </div>
          <div className="card-body">
            <BarChartWidget
              data={visitsChartData}
              bars={[
                { key: 'scheduled', name: 'Scheduled', color: '#2878C8' },
                { key: 'completed', name: 'Completed', color: '#22A06B' },
                { key: 'missed', name: 'Missed', color: '#DC3545' },
              ]}
              xKey="week"
              height={200}
            />
          </div>
        </div>

        {/* Plant Performance */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Portfolio Generation Trend</h3>
            <span className="text-xs text-text-secondary">Expected vs Actual (MWh)</span>
          </div>
          <div className="card-body">
            <AreaChartWidget
              data={plantPerformanceData}
              areas={[
                { key: 'expected', name: 'Expected', color: '#9FB3C8' },
                { key: 'actual', name: 'Actual', color: '#F9B233' },
              ]}
              xKey="month"
              height={200}
            />
          </div>
        </div>
      </div>

      {/* Operational Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Today's Schedule */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-solar" />
              <h3 className="card-title">Today's Schedule</h3>
            </div>
            <button onClick={() => navigate('/schedule')} className="text-xs text-solar font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-border">
            {todayVisits.map(visit => (
              <div key={visit.id} className="px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate('/schedule')}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-text-muted shrink-0" />
                    <span className="text-xs font-semibold text-navy">{visit.scheduledTime}</span>
                  </div>
                  <Badge status={visit.status} size="xs" dot />
                </div>
                <p className="text-sm font-medium text-navy truncate">{visit.customerName}</p>
                <p className="text-xs text-text-secondary truncate">{visit.siteName}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-text-muted capitalize">{visit.serviceType.replace(/_/g, ' ')}</span>
                  <span className="text-xxs text-text-muted">• {visit.technicianName}</span>
                </div>
              </div>
            ))}
            {todayVisits.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-text-muted">No visits scheduled for today</div>
            )}
          </div>
        </div>

        {/* Open Tickets */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-danger" />
              <h3 className="card-title">Open Tickets</h3>
              <span className="bg-danger-50 text-danger text-xxs font-bold px-1.5 py-0.5 rounded-sm">
                {openTickets.length}
              </span>
            </div>
            <button onClick={() => navigate('/tickets')} className="text-xs text-solar font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-border">
            {openTickets.map(ticket => (
              <div
                key={ticket.id}
                className="px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-text-muted">{ticket.ticketId}</span>
                  <Badge status={ticket.priority} size="xs" />
                </div>
                <p className="text-sm font-medium text-navy leading-snug line-clamp-1">{ticket.title}</p>
                <p className="text-xs text-text-secondary mt-0.5">{ticket.customerName}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <Badge status={ticket.status} size="xs" dot />
                  <span className="text-xxs text-text-muted">{ticket.assignedName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning" />
              <h3 className="card-title">AI Insights</h3>
              <span className="bg-warning-50 text-warning-700 text-xxs font-bold px-1.5 py-0.5 rounded-sm">
                {criticalInsights.length} critical
              </span>
            </div>
            <button onClick={() => navigate('/ai-analytics')} className="text-xs text-solar font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-border">
            {criticalInsights.map(insight => (
              <div
                key={insight.id}
                className="px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate('/ai-analytics')}
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge status={insight.severity} size="xs" dot />
                  <span className="text-xs font-semibold text-danger">
                    Est. loss: {formatCurrency(insight.estimatedLoss)}/mo
                  </span>
                </div>
                <p className="text-sm font-semibold text-navy leading-snug">{insight.problem}</p>
                <p className="text-xs text-text-secondary mt-0.5 truncate">{insight.siteName}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xxs text-text-muted">AI Confidence: {insight.aiConfidence}%</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/tickets'); toast.info('Creating ticket from AI insight...'); }}
                    className="text-xs text-solar font-medium hover:underline"
                  >
                    Create Ticket
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Opportunity */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title flex items-center gap-2">
              <TrendingUp size={16} className="text-success" />
              Revenue Opportunity
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Contracts and customers that represent growth potential</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/contracts')}>
            Manage Renewals
          </Button>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Contracts Expiring this Month', value: '8', color: 'bg-warning-50 border-warning/20', text: 'text-warning-700', sub: 'Action required' },
              { label: 'Customers Eligible for Upgrade', value: '23', color: 'bg-success-50 border-success/20', text: 'text-success-700', sub: 'Upgrade opportunity' },
              { label: 'Sites Without AMC', value: '41', color: 'bg-info-50 border-info/20', text: 'text-info-700', sub: 'Uncontracted sites' },
              { label: 'Estimated Renewal Revenue', value: '₹24.8L', color: 'bg-solar/5 border-solar/20', text: 'text-solar-dark', sub: 'This quarter' },
            ].map(item => (
              <div key={item.label} className={`p-4 rounded-lg border ${item.color}`}>
                <p className={`text-2xl font-bold ${item.text} mb-1`}>{item.value}</p>
                <p className="text-xs font-medium text-text-secondary">{item.label}</p>
                <p className={`text-xxs font-medium mt-2 ${item.text}`}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Ticket Status Distribution</h3>
          </div>
          <div className="card-body">
            <PieChartWidget data={ticketStatusData} height={180} />
          </div>
        </div>

        {/* Expiring Contracts */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="text-warning" />
              <h3 className="card-title">Contracts Expiring Soon</h3>
            </div>
            <button onClick={() => navigate('/contracts')} className="text-xs text-solar font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  {['Customer', 'Plan', 'Expiry', 'Contract Value', 'Renewal Prob.', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expiringContracts.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/contracts/${c.id}`)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy text-sm truncate max-w-[140px]">{c.customerName}</p>
                      <p className="text-xs text-text-secondary">{formatCapacity(c.capacity)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{c.planName}</td>
                    <td className="px-4 py-3 text-sm text-warning-700 font-medium">{formatDate(c.endDate)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-navy">{formatCurrency(c.contractValue)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                          <div className="h-full bg-success rounded-full" style={{ width: '78%' }} />
                        </div>
                        <span className="text-xs font-medium text-navy">78%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); toast.success('Renewal reminder sent!'); }}
                        className="text-xs text-solar font-medium hover:underline whitespace-nowrap"
                      >
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
    </div>
  );
}
