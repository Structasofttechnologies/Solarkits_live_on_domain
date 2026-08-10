import { useMemo } from "react";
import {
  FaHome, FaClock, FaBoxes, FaTruck,
  FaCheckCircle,
  FaExclamationTriangle, FaTools, FaUndo,
  FaArrowRight, FaArrowUp, FaArrowDown
} from "react-icons/fa";
import { MdOutlineSummarize, MdOutlineCategory } from "react-icons/md";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user_slice || {});

  // 1. Order Summary Data
  const orderSummary = useMemo(() => ([
    { label: "Total Pending Orders", value: 147, icon: <FaClock className="text-amber-500" />, color: "border-amber-500/20 bg-amber-500/5 text-amber-500" },
    { label: "Ready for Dispatch", value: 42, icon: <FaCheckCircle className="text-primary" />, color: "border-primary/20 bg-primary/5 text-primary" },
    { label: "Partially Dispatched", value: 18, icon: <FaBoxes className="text-blue-500" />, color: "border-blue-500/20 bg-blue-500/5 text-blue-500" },
    { label: "Delivered Orders", value: 894, icon: <FaTruck className="text-success" />, color: "border-success/20 bg-success/5 text-success" },
    { label: "Delayed Deliveries", value: 12, icon: <FaExclamationTriangle className="text-danger" />, color: "border-danger/20 bg-danger/5 text-danger" },
    { label: "Replacement Pending", value: 5, icon: <FaUndo className="text-purple-500" />, color: "border-purple-500/20 bg-purple-500/5 text-purple-500" },
    { label: "Repair Tickets Open", value: 9, icon: <FaTools className="text-pink-500" />, color: "border-pink-500/20 bg-pink-500/5 text-pink-500" }
  ]), []);

  // 2. Material Summary Data
  const materialSummary = useMemo(() => ([
    { label: "Total Inward Today", value: "350 KW", detail: "+120 KW since yesterday", trend: "up", icon: <FaArrowUp className="text-success w-3 h-3" /> },
    { label: "Total Outward Today", value: "280 KW", detail: "+80 KW since yesterday", trend: "up", icon: <FaArrowUp className="text-success w-3 h-3" /> },
    { label: "Available Stock", value: "2,450 KW", detail: "92% of maximum capacity", trend: "neutral", icon: null },
    { label: "Reserved Stock", value: "480 KW", detail: "Allocated to active orders", trend: "neutral", icon: null },
    { label: "Damaged Stock", value: "18 KW", detail: "Requires QC investigation", trend: "down", icon: <FaArrowDown className="text-danger w-3 h-3" /> }
  ]), []);

  // 3. Delivery Summary Data
  const deliverySummary = useMemo(() => ([
    { label: "Deliveries Scheduled Today", value: 24 },
    { label: "Vehicles Assigned", value: 8 },
    { label: "Out for Delivery", value: 14 },
    { label: "Delivered Today", value: 10 },
    { label: "Average Delivery Time", value: "3.4 hrs" }
  ]), []);

  // 4. Alerts Feed Data
  const alerts = useMemo(() => ([
    { label: "Low Stock Alert: 540W Mono PERC", text: "Available stock dropped below buffer limit (50 panels left)", type: "low-stock", time: "10 mins ago", severity: "high" },
    { label: "Delayed Supplier Delivery (PO-8812)", text: "Tata Solar delivery delayed by 48 hours due to transit issues", type: "delayed-supplier", time: "1 hour ago", severity: "medium" },
    { label: "Vehicle Capacity Overload (GJ-01-XX-9922)", text: "Scheduled outward load exceeds vehicle weight configuration by 12%", type: "overload", time: "2 hours ago", severity: "high" },
    { label: "Pending Dispatch > 48 hrs (ORD-9821)", text: "Fulfillment pending for order ORD-9821 since 2026-05-19", type: "pending-48", time: "3 hours ago", severity: "medium" },
    { label: "Overdue Customer Ticket #8492", text: "Replacement ticket has been pending assignment for over 24 hours", type: "overdue-ticket", time: "5 hours ago", severity: "low" }
  ]), []);

  return (
    <div className="min-h-screen space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl gradient-primary shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative px-6 py-8 lg:px-8 lg:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
                  <FaHome className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                    Warehouse Management Dashboard
                  </h1>
                  <span className="text-white/70 text-sm capitalize">
                    Active System Operations • Welcome back, {user?.name || "Ravi Harsoda"}
                  </span>
                </div>
              </div>
              <p className="text-white/80 text-base max-w-xl mt-2">
                Monitor incoming supplier stock, verification checkpoints, active dispatches, and delivery status logs in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Columns (Span 2): Summaries & Metrics */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Order Summary Grid */}
          <div className="card p-6 space-y-4">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
              <MdOutlineSummarize className="text-primary text-xl" />
              Order Fulfillment Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {orderSummary.map((item) => (
                <div 
                  key={item.label}
                  className={`border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] cursor-pointer ${item.color}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider leading-tight">{item.label}</span>
                    <div className="text-lg">{item.icon}</div>
                  </div>
                  <h2 className="text-2xl font-black mt-3 text-text-primary">{item.value}</h2>
                </div>
              ))}
            </div>
          </div>

          {/* Material & Stock Summary */}
          <div className="card p-6 space-y-4">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
              <MdOutlineCategory className="text-primary text-xl" />
              Material & Stock Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {materialSummary.map((m) => (
                <div 
                  key={m.label}
                  className="bg-bg/40 border border-border/60 hover:border-primary/30 p-4 rounded-2xl flex flex-col justify-between transition-all duration-300"
                >
                  <div>
                    <span className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                    <h3 className="text-lg font-black mt-2 text-text-primary leading-none">{m.value}</h3>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    {m.icon}
                    <span className="text-[10px] text-text-muted font-semibold leading-tight">{m.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Logistics Status */}
          <div className="card p-6 space-y-4">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
              <FaTruck className="text-primary text-lg" />
              Daily Dispatch & Delivery Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {deliverySummary.map((item, idx) => (
                <div 
                  key={item.label}
                  className="p-4 rounded-xl bg-linear-to-b from-primary/5 to-transparent border border-primary/10 flex flex-col justify-between"
                >
                  <span className="text-text-secondary text-[10px] font-bold uppercase tracking-wider leading-tight">{item.label}</span>
                  <h2 className="text-xl font-bold mt-2 text-primary">{item.value}</h2>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts and Activity feed */}
        <div className="space-y-6">
          <div className="card p-6 flex flex-col h-full">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3 mb-4">
              <FaExclamationTriangle className="text-danger" />
              Real-time Alert Center
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[580px] pr-1">
              {alerts.map((alert, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col gap-1 transition-all ${
                    alert.severity === 'high' 
                      ? 'border-danger/20 bg-danger/5' 
                      : alert.severity === 'medium'
                      ? 'border-warning/20 bg-warning/5'
                      : 'border-blue-500/20 bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`text-xs font-bold ${
                      alert.severity === 'high' ? 'text-danger' : alert.severity === 'medium' ? 'text-warning' : 'text-blue-500'
                    }`}>
                      {alert.label}
                    </span>
                    <span className="text-[9px] text-text-muted font-semibold whitespace-nowrap shrink-0">{alert.time}</span>
                  </div>
                  <p className="text-text-secondary text-xs leading-normal mt-0.5">{alert.text}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs text-text-muted">
              <span>Updated automatically in background</span>
              <button 
                onClick={() => navigate('/material-inward')}
                className="text-primary font-bold hover:underline flex items-center gap-1"
              >
                Inward Check <FaArrowRight size={10} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
