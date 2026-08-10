// src/pages/ai-analytics/AIAnalyticsPage.jsx
import { Brain, AlertTriangle, TrendingDown, Zap, RefreshCw } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { aiInsights } from '../../mocks/data';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { BarChartWidget, PieChartWidget } from '../../components/charts/ChartWidgets';
import { toast } from '../../hooks';

const anomalyTypes = [
  { name: 'Inverter Fault', value: 28, color: '#DC3545' },
  { name: 'Low Performance', value: 35, color: '#F59E0B' },
  { name: 'Soiling', value: 18, color: '#9FB3C8' },
  { name: 'String Mismatch', value: 12, color: '#2878C8' },
  { name: 'Grid Outage', value: 7, color: '#0B3A53' },
];

const impactData = [
  { month: 'Sep', loss: 42000, prevented: 58000 },
  { month: 'Oct', loss: 38000, prevented: 72000 },
  { month: 'Nov', loss: 55000, prevented: 65000 },
  { month: 'Dec', loss: 31000, prevented: 80000 },
  { month: 'Jan', loss: 48000, prevented: 91000 },
];

export default function AIAnalyticsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Brain size={22} className="text-solar" />
            AI Analytics & Insights
          </h1>
          <p className="page-subtitle">AI-powered fault detection, energy loss analysis, and predictive maintenance</p>
        </div>
        <Button size="sm" leftIcon={<RefreshCw size={14} />} onClick={() => toast.success('AI analysis updated!')}>
          Refresh Analysis
        </Button>
      </div>

      {/* AI KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Active AI Alerts', value: aiInsights.filter(a => a.severity === 'critical').length, color: 'text-danger', bg: 'bg-danger/5' },
          { label: 'Anomalies Detected', value: 23, color: 'text-warning', bg: 'bg-warning/5' },
          { label: 'Energy Loss This Month', value: '₹4.2L', color: 'text-danger', bg: 'bg-danger/5' },
          { label: 'Loss Prevented by AI', value: '₹12.8L', color: 'text-success', bg: 'bg-success/5' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-lg p-4`}>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-text-secondary mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="card-title mb-4">Energy Loss vs Prevented (₹)</h3>
          <BarChartWidget
            data={impactData}
            bars={[
              { key: 'prevented', name: 'Loss Prevented (₹)', color: '#22A06B' },
              { key: 'loss', name: 'Energy Loss (₹)', color: '#DC3545' },
            ]}
            xKey="month"
            height={200}
          />
        </div>
        <div className="card p-5">
          <h3 className="card-title mb-4">Anomaly Distribution</h3>
          <PieChartWidget data={anomalyTypes} height={180} innerRadius={40} />
        </div>
      </div>

      {/* AI Insights */}
      <div className="card">
        <div className="card-header px-5 py-4">
          <h3 className="card-title flex items-center gap-2">
            <Brain size={16} className="text-solar" />
            AI-Generated Insights
          </h3>
          <span className="text-xs text-text-muted">Powered by Emergesun AI Engine v2.1</span>
        </div>
        <div className="divide-y divide-border">
          {aiInsights.map(insight => (
            <div key={insight.id} className="px-5 py-4 hover:bg-gray-50">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  insight.severity === 'critical' ? 'bg-danger/10' :
                  insight.severity === 'high' ? 'bg-warning/10' : 'bg-info/10'
                }`}>
                  {insight.severity === 'critical' ? <AlertTriangle size={18} className="text-danger" /> :
                   insight.severity === 'high' ? <TrendingDown size={18} className="text-warning" /> :
                   <Zap size={18} className="text-info" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge status={insight.severity} size="xs" dot />
                    <span className="text-xs text-text-muted">{insight.type?.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-text-muted">•</span>
                    <span className="text-xs text-solar font-medium">AI Confidence: {insight.aiConfidence}%</span>
                  </div>
                  <p className="font-bold text-navy text-sm">{insight.problem}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{insight.siteName} • {insight.customerName}</p>
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">{insight.recommendation}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs font-medium text-danger">
                      Est. loss: {formatCurrency(insight.estimatedLoss)}/month
                    </span>
                    <span className="text-xs text-text-muted">Detected: {formatDate(insight.detectedAt)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() => toast.success('Ticket created from AI insight!')}
                  >
                    Create Ticket
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => toast.info('Marking as acknowledged...')}>
                    Acknowledge
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Features */}
      <div className="card p-5">
        <h3 className="card-title mb-4">AI Capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Fault Detection', desc: 'Real-time detection of inverter faults, string mismatches, soiling patterns, and anomalous PR values using ML algorithms.', status: 'connected' },
            { title: 'Predictive Maintenance', desc: 'AI predicts component failures 7-14 days in advance based on performance trends and historical failure patterns.', status: 'connected' },
            { title: 'Energy Loss Analysis', desc: 'Automated quantification of energy losses due to downtime, soiling, clipping, shading, and degradation.', status: 'connected' },
            { title: 'Cleaning Optimization', desc: 'Recommends optimal cleaning schedules based on soiling rate, weather, and energy yield improvement ROI.', status: 'connected' },
            { title: 'Renewal Probability', desc: 'Predicts customer renewal likelihood based on satisfaction score, payment history, and service quality metrics.', status: 'connected' },
            { title: 'Anomaly Detection', desc: 'Detects unusual consumption patterns, grid-side issues, and data gaps that indicate monitoring failures.', status: 'coming_soon' },
          ].map(f => (
            <div key={f.title} className="p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-navy text-sm">{f.title}</p>
                <Badge status={f.status} size="xs" dot />
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
