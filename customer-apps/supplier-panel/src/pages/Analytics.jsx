import React from "react";
import PageHeader from "../components/PageHeader";
import { FaChartLine, FaArrowUp, FaArrowDown, FaCalendarAlt, FaDownload, FaLock, FaGlobe } from "react-icons/fa";
import Button from "../components/Button";

export default function Analytics() {

  const performanceMetrics = [
    { title: 'Total Sales', value: '₹12.8M', change: '+22%', trend: 'up' },
    { title: 'Avg Order Value', value: '₹42.5K', change: '-5%', trend: 'down' },
    { title: 'Customer Growth', value: '142', change: '+12', trend: 'up' },
    { title: 'Market Share', value: '1.2%', change: '+0.1%', trend: 'up' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Market Analytics" 
        subtitle="Real-time data visualization of your business performance and growth." 
        icon={FaChartLine}
        actions={
          <div className="flex gap-4">
            <Button variant="outline-primary" className="rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-widest" leftIcon={<FaCalendarAlt />}>
              Last 30 Days
            </Button>
            <Button variant="primary" className="rounded-xl h-12 px-8 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20" leftIcon={<FaDownload />}>
              Download Report
            </Button>
          </div>
        }
      />

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((m, idx) => (
          <div key={idx} className="card p-6 bg-surface border-border overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 gradient-primary opacity-5 group-hover:opacity-10 transition-opacity -mr-8 -mt-8 rounded-full" />
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{m.title}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-black text-text-primary tracking-tight">{m.value}</h3>
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${m.trend === 'up' ? 'text-success' : 'text-danger'}`}>
                {m.trend === 'up' ? <FaArrowUp /> : <FaArrowDown />}
                {m.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card bg-surface border-border p-8 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">Revenue Trends</h3>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="w-3 h-3 rounded-full bg-secondary" />
            </div>
          </div>
          <div className="flex-1 bg-surface-hover/30 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center p-10 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-surface border-2 border-border flex items-center justify-center text-3xl text-primary/40">
              <FaChartLine />
            </div>
            <div>
              <p className="text-lg font-black text-text-primary uppercase tracking-tight">Visualization Engine Ready</p>
              <p className="text-sm font-semibold text-text-secondary">Connecting to live market data stream...</p>
            </div>
          </div>
        </div>

        <div className="card bg-surface border-border p-8 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">Sales Distribution</h3>
            <div className="flex gap-2">
              <button className="text-[10px] font-black text-primary uppercase">Region</button>
              <button className="text-[10px] font-black text-text-muted uppercase">Category</button>
            </div>
          </div>
          <div className="flex-1 bg-surface-hover/30 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center p-10 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-surface border-2 border-border flex items-center justify-center text-3xl text-secondary/40">
              <FaGlobe />
            </div>
            <div>
              <p className="text-lg font-black text-text-primary uppercase tracking-tight">Geographic Heatmap</p>
              <p className="text-sm font-semibold text-text-secondary">Processing distribution across 12 states...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Supply Chain Insights */}
      <div className="card bg-surface border-border p-8">
        <h3 className="text-xl font-black text-text-primary uppercase tracking-tight mb-8">Predictive Supply Chain Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-surface-hover rounded-2xl flex items-center justify-center text-xs font-black text-text-muted uppercase tracking-wider">
              {i === 1 ? '📈 Predictive Stock Forecasting' : i === 2 ? '🤖 AI Pricing Recommendations' : '📊 Competitor Benchmarking'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
