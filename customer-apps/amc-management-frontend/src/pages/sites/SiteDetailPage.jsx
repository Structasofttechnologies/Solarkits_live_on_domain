// src/pages/sites/SiteDetailPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Activity, Calendar, Droplets, Wrench, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AreaChartWidget, BarChartWidget } from '../../components/charts/ChartWidgets';
import { sites, customers, contracts } from '../../mocks/data';
import { formatDate, formatCapacity, formatEnergy, formatPercentage } from '../../utils/formatters';
import { toast } from '../../hooks';

const TABS = ['Overview', 'Live Monitoring', 'Equipment', 'AMC Contract', 'Visit History', 'Cleaning History', 'Documents'];

const mockGenerationData = [
  { day: 'Mon', actual: 1840, expected: 1920 },
  { day: 'Tue', actual: 1920, expected: 1920 },
  { day: 'Wed', actual: 1750, expected: 1920 },
  { day: 'Thu', actual: 1980, expected: 1920 },
  { day: 'Fri', actual: 1860, expected: 1920 },
  { day: 'Sat', actual: 1720, expected: 1920 },
  { day: 'Sun', actual: 1840, expected: 1920 },
];

export default function SiteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');

  const site = sites.find(s => s.id === id) || sites[0];
  const customer = customers.find(c => c.id === site.customerId);
  const contract = contracts.find(c => c.siteId === site.id);

  const equipmentItems = [
    { label: 'Solar Modules', count: site.moduleCount, status: 'healthy', value: `${site.moduleBrand} ${site.moduleWattage}Wp` },
    { label: 'Inverters', count: site.inverterCount, status: site.activeFaults > 0 ? 'warning' : 'healthy', value: `${site.inverterBrand}` },
    { label: 'ACDB', count: 1, status: 'healthy', value: 'Indoor' },
    { label: 'DCDB', count: 1, status: 'healthy', value: 'Indoor' },
    { label: 'Earthing', count: 3, status: 'healthy', value: 'GI Plate' },
    { label: 'SPD', count: 2, status: 'healthy', value: 'AC + DC' },
    { label: 'MC4 Connectors', count: site.moduleCount * 2, status: 'healthy', value: 'Stäubli' },
    { label: 'Mounting Structure', count: site.moduleCount / 20, status: 'healthy', value: 'GI' },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate('/sites')} className="p-2 rounded-lg hover:bg-gray-100 text-text-secondary">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-navy">{site.name}</h1>
            <Badge status={site.monitoringStatus} dot />
          </div>
          <p className="text-sm text-text-secondary">{site.customerName} • {site.city}, {site.state} • {formatCapacity(site.capacity)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/monitoring')}>View Monitoring</Button>
          <Button size="sm" leftIcon={<Calendar size={14} />} onClick={() => { toast.success('Scheduling visit...'); navigate('/schedule'); }}>Schedule Visit</Button>
        </div>
      </div>

      {/* Live KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Current Power', value: `${site.currentGeneration} kW`, sub: `of ${formatCapacity(site.capacity)} capacity`, color: 'text-solar', icon: Zap },
          { label: "Today's Generation", value: formatEnergy(site.todayGeneration), sub: 'kWh generated', color: 'text-success', icon: Activity },
          { label: 'Plant Availability', value: formatPercentage(site.availability), sub: 'this month', color: 'text-info', icon: TrendingUp },
          { label: 'Active Faults', value: site.activeFaults, sub: site.activeFaults > 0 ? 'Attention needed' : 'All clear', color: site.activeFaults > 0 ? 'text-danger' : 'text-success', icon: site.activeFaults > 0 ? AlertTriangle : CheckCircle2 },
        ].map(k => (
          <div key={k.label} className="kpi-card" onClick={() => setActiveTab('Live Monitoring')}>
            <div className="flex items-center justify-between mb-3">
              <k.icon size={18} className={k.color} />
              <span className="text-xxs font-medium text-success bg-success-50 px-1.5 py-0.5 rounded">LIVE</span>
            </div>
            <p className={`text-2xl font-bold ${k.color} mb-1`}>{k.value}</p>
            <p className="text-xs text-text-secondary">{k.label}</p>
            <p className="text-xxs text-text-muted mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Additional KPIs */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Performance Ratio', value: formatPercentage(site.pr) },
          { label: 'CUF', value: formatPercentage(site.cuf) },
          { label: 'Monthly Gen.', value: formatEnergy(site.monthlyGeneration) },
          { label: 'Last Cleaning', value: formatDate(site.lastCleaning) },
          { label: 'Next Maintenance', value: formatDate(site.nextMaintenance) },
          { label: 'Commission Date', value: formatDate(site.commissioningDate) },
        ].map(k => (
          <div key={k.label} className="card p-3 text-center">
            <p className="text-base font-bold text-navy">{k.value}</p>
            <p className="text-xxs text-text-secondary mt-1">{k.label}</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Plant Specs */}
              <div>
                <h3 className="text-sm font-semibold text-navy mb-3">Plant Specifications</h3>
                <div className="space-y-2">
                  {[
                    ['Type', site.type + ' / ' + site.subType.replace('_', ' ')],
                    ['Installed Capacity', formatCapacity(site.capacity)],
                    ['AC Capacity', formatCapacity(site.acCapacity)],
                    ['DC Capacity', formatCapacity(site.dcCapacity)],
                    ['Module Brand', `${site.moduleBrand} ${site.moduleModel}`],
                    ['Module Wattage', `${site.moduleWattage} Wp`],
                    ['Total Modules', site.moduleCount],
                    ['Inverter Brand', `${site.inverterBrand} ${site.inverterModel}`],
                    ['Total Inverters', site.inverterCount],
                    ['String Count', site.stringCount],
                    ['Mounting', site.mountingType.replace('_', ' ')],
                    ['DISCOM', site.discom],
                    ['Consumer No.', site.consumerNo],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-border last:border-0">
                      <span className="text-sm text-text-secondary">{label}</span>
                      <span className="text-sm font-medium text-navy capitalize">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Generation Chart */}
              <div>
                <h3 className="text-sm font-semibold text-navy mb-3">Generation — Last 7 Days</h3>
                <AreaChartWidget
                  data={mockGenerationData}
                  areas={[
                    { key: 'expected', name: 'Expected (kWh)', color: '#9FB3C8' },
                    { key: 'actual', name: 'Actual (kWh)', color: '#F9B233' },
                  ]}
                  xKey="day"
                  height={220}
                />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total This Week', value: `${(site.todayGeneration * 6 / 1000).toFixed(1)} MWh` },
                    { label: 'Best Day', value: '1.98 MWh' },
                    { label: 'Avg PR', value: formatPercentage(site.pr) },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-base font-bold text-navy">{s.value}</p>
                      <p className="text-xxs text-text-secondary">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Equipment Tab */}
          {activeTab === 'Equipment' && (
            <div>
              <h3 className="text-sm font-semibold text-navy mb-4">Plant Health Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {equipmentItems.map(eq => (
                  <div key={eq.label} className={`p-4 rounded-lg border-2 ${eq.status === 'healthy' ? 'border-success/20 bg-success-50' : 'border-warning/20 bg-warning-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-navy">{eq.label}</span>
                      {eq.status === 'healthy' ? <CheckCircle2 size={14} className="text-success" /> : <AlertTriangle size={14} className="text-warning" />}
                    </div>
                    <p className="text-lg font-bold text-navy">{eq.count}</p>
                    <p className="text-xxs text-text-secondary">{eq.value}</p>
                    <Badge status={eq.status} size="xs" className="mt-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AMC Contract Tab */}
          {activeTab === 'AMC Contract' && (
            <div>
              {contract ? (
                <div className="space-y-4">
                  <div className="p-4 bg-solar/5 border border-solar/20 rounded-lg">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="font-bold text-navy text-lg">{contract.planName}</p>
                        <p className="text-sm text-text-secondary">{contract.contractId}</p>
                      </div>
                      <Badge status={contract.status} dot />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      ['Start Date', formatDate(contract.startDate)],
                      ['End Date', formatDate(contract.endDate)],
                      ['Contract Value', `₹${contract.contractValue.toLocaleString('en-IN')}`],
                      ['Payment Status', contract.paymentStatus],
                    ].map(([label, value]) => (
                      <div key={label} className="p-3 rounded-lg border border-border">
                        <p className="text-xs text-text-secondary">{label}</p>
                        <p className="text-sm font-semibold text-navy mt-1 capitalize">{value}</p>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => navigate(`/contracts/${contract.id}`)}>View Full Contract</Button>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-navy mb-2">No AMC contract found for this site</p>
                  <Button size="sm" onClick={() => navigate('/contracts/new')}>Create Contract</Button>
                </div>
              )}
            </div>
          )}

          {/* Other tabs */}
          {['Visit History', 'Cleaning History', 'Documents'].includes(activeTab) && (
            <div className="py-12 text-center">
              <p className="text-sm text-text-muted">{activeTab} — loading data...</p>
            </div>
          )}

          {/* Live Monitoring Tab */}
          {activeTab === 'Live Monitoring' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-warning-50 border border-warning/20 rounded-lg">
                <AlertTriangle size={16} className="text-warning" />
                <p className="text-sm text-warning-700 font-medium">Demo Data — This is simulated monitoring data for demonstration purposes.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Current Power', value: `${site.currentGeneration} kW`, status: 'live' },
                  { label: 'Grid Voltage', value: '398 V', status: 'normal' },
                  { label: 'Grid Frequency', value: '49.98 Hz', status: 'normal' },
                  { label: 'Irradiance', value: '785 W/m²', status: 'normal' },
                  { label: 'Ambient Temp', value: '28°C', status: 'normal' },
                  { label: 'Module Temp', value: '42°C', status: 'normal' },
                ].map(m => (
                  <div key={m.label} className="card p-3">
                    <p className="text-xs text-text-secondary">{m.label}</p>
                    <p className="text-xl font-bold text-navy mt-1">{m.value}</p>
                    <span className="text-xxs text-success font-medium">● LIVE</span>
                  </div>
                ))}
              </div>
              <AreaChartWidget
                data={mockGenerationData}
                areas={[{ key: 'actual', name: 'Power Output (kW)', color: '#F9B233' }]}
                xKey="day"
                height={200}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
