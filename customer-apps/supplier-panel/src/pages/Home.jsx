import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { 
  FaRocket, FaBoxOpen, FaClipboardList, FaChartLine, FaArrowUp, 
  FaCheckCircle, FaExclamationTriangle, FaHourglassHalf, FaBell,
  FaMapMarkerAlt, FaTruck, FaFileInvoiceDollar, FaChartBar, FaWarehouse
} from 'react-icons/fa';
import { motion } from "framer-motion";
import Button from "../components/Button";

export default function Home() {
  const authState = useSelector(state => state.auth_slice);
  const supplier = authState?.supplier || { company_name: 'Partner Supplier' };

  // Unified metrics
  const activeStats = [
    { label: 'Assigned Orders', value: '18', trend: '4 Pending', icon: <FaClipboardList className="text-primary" />, color: 'bg-primary/10' },
    { label: 'Completed Orders', value: '14', trend: '+12% this week', icon: <FaCheckCircle className="text-success" />, color: 'bg-success/10' },
    { label: 'Pending Dispatch', value: '4', trend: '2 Rush Orders', icon: <FaHourglassHalf className="text-warning" />, color: 'bg-warning/10' },
    { label: 'Fulfillment Score', value: '98.2%', trend: 'Grade A', icon: <FaTruck className="text-secondary" />, color: 'bg-secondary/10' },
  ];

  const activeOrders = [
    { id: 'ORD-5402', project: 'Indore Solar Phase-I', status: 'Assigned', amount: '₹1,45,000', date: 'Just now' },
    { id: 'ORD-5398', project: 'Ujjain Residential EPC', status: 'Accepted', amount: '₹95,000', date: '3 hours ago' },
    { id: 'ORD-5389', project: 'Dewas Agriculture Lift', status: 'Dispatched', amount: '₹2,10,000', date: 'Yesterday' },
    { id: 'PROC-9011', project: 'Western Region Cluster', status: 'Bid Open', amount: '₹12,40,000', date: '15 mins ago' },
  ];

  const activeNotifications = [
    { title: 'New Order Assignment: Indore Solar Phase-I', time: 'Just now', type: 'order' },
    { title: 'Invoice accepted by accounts for ORD-5389', time: '1h ago', type: 'invoice' },
    { title: 'Procurement demand surge in Western Region', time: '4h ago', type: 'system' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-120 from-primary via-primary-end to-primary p-8 md:p-10 shadow-xl border border-primary/20">
        <div className="absolute inset-0 bg-grid-white/10 mask-[linear-gradient(0deg,transparent,black)]"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="bg-white/20 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
              🌱 Registered Partner
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white mt-4 tracking-tight">
              Welcome back, {supplier?.company_name || 'Partner'}!
            </h1>
            <p className="text-white/80 font-medium mt-2 max-w-xl text-sm">
              Manage assigned orders, accept incoming projects, update shipping dispatch status, and process sales invoices.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button 
              variant="secondary" 
              className="bg-white text-primary hover:bg-white/95 rounded-xl font-bold text-xs uppercase tracking-widest h-12 shadow-lg"
              onClick={() => window.location.hash = '#orders'}
            >
              Manage Orders
            </Button>
            <Button 
              variant="ghost" 
              className="text-white border border-white/30 hover:bg-white/10 rounded-xl font-bold text-xs uppercase tracking-widest h-12"
              onClick={() => window.location.hash = '#analytics'}
            >
              Fulfillment Report
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeStats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="card p-6 bg-surface border-border flex flex-col justify-between hover:translate-y-[-4px] transition-transform duration-300 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center text-xl`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                {stat.trend}
              </span>
            </div>
            <div className="mt-6">
              <p className="text-xs font-black text-text-muted uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-text-primary mt-1 tracking-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Section: Orders & Chart */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Custom Graphical Representation */}
          <div id="analytics" className="card p-6 bg-surface border-border">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">
                  Fulfillment Performance (Weekly)
                </h3>
                <p className="text-xs text-text-secondary">Visual analysis of orders cleared vs. pending</p>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span> Cleared
                </span>
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block"></span> Pending
                </span>
              </div>
            </div>

            {/* Custom SVG Dashboard Chart */}
            <div className="h-64 w-full flex items-end justify-between gap-4 pt-4 px-2 bg-linear-120 from-primary/5 to-transparent rounded-2xl border border-border/50 relative overflow-hidden">
              
              {/* Horizontal gridlines */}
              <div className="absolute inset-x-0 top-1/4 border-b border-border/40 w-full"></div>
              <div className="absolute inset-x-0 top-2/4 border-b border-border/40 w-full"></div>
              <div className="absolute inset-x-0 top-3/4 border-b border-border/40 w-full"></div>

              {/* Chart Bars */}
              <div className="flex-1 flex flex-col items-center gap-2 z-10">
                <div className="w-8 bg-primary rounded-t-lg transition-all duration-500 hover:brightness-110 relative group" style={{ height: '120px' }}>
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface border border-border text-[10px] font-bold px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">6</span>
                </div>
                <span className="text-[10px] font-bold text-text-muted">Mon</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 z-10">
                <div className="w-8 bg-primary rounded-t-lg transition-all duration-500 hover:brightness-110 relative group" style={{ height: '160px' }}>
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface border border-border text-[10px] font-bold px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">8</span>
                </div>
                <span className="text-[10px] font-bold text-text-muted">Tue</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 z-10">
                <div className="w-8 bg-primary rounded-t-lg transition-all duration-500 hover:brightness-110 relative group" style={{ height: '90px' }}>
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface border border-border text-[10px] font-bold px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">4</span>
                </div>
                <span className="text-[10px] font-bold text-text-muted">Wed</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 z-10">
                <div className="w-8 bg-secondary rounded-t-lg transition-all duration-500 hover:brightness-110 relative group" style={{ height: '180px' }}>
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface border border-border text-[10px] font-bold px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">9</span>
                </div>
                <span className="text-[10px] font-bold text-text-muted">Thu</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 z-10">
                <div className="w-8 bg-primary rounded-t-lg transition-all duration-500 hover:brightness-110 relative group" style={{ height: '210px' }}>
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface border border-border text-[10px] font-bold px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">11</span>
                </div>
                <span className="text-[10px] font-bold text-text-muted">Fri</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 z-10">
                <div className="w-8 bg-primary rounded-t-lg transition-all duration-500 hover:brightness-110 relative group" style={{ height: '140px' }}>
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface border border-border text-[10px] font-bold px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">7</span>
                </div>
                <span className="text-[10px] font-bold text-text-muted">Sat</span>
              </div>
            </div>
          </div>

          {/* Recent Orders Registry List */}
          <div id="orders" className="card bg-surface border-border overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">
                Recent Orders Registry
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs font-black text-primary uppercase hover:underline"
                onClick={() => window.location.href = '/dashboard/orders'}
              >
                View Workflow Panel
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-hover/50 text-[10px] font-black text-text-muted uppercase tracking-widest">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Project Site</th>
                    <th className="px-6 py-4">Fulfillment Status</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4 text-right">Time Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {activeOrders.map((order, idx) => (
                    <tr key={idx} className="hover:bg-surface-hover/30 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-text-primary group-hover:text-primary transition-colors">{order.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-text-secondary">{order.project}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                          order.status === 'Completed' || order.status === 'Dispatched' ? 'bg-success/10 text-success border-success/20' : 
                          order.status === 'Accepted' ? 'bg-primary/10 text-primary border-primary/20' : 
                          'bg-warning/10 text-warning border-warning/20'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-text-primary">{order.amount}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-bold text-text-muted">{order.date}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Panel: Real-time Feed & Scorecard */}
        <div className="space-y-8">
          
          {/* Notifications / Real-time Feed */}
          <div className="card bg-surface border-border flex flex-col h-full">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Live Operations Feed</h3>
              <FaBell className="text-primary animate-pulse" />
            </div>
            
            <div className="flex-1 p-6 space-y-6">
              {activeNotifications.map((note, idx) => (
                <div key={idx} className="flex gap-4 group">
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border border-border/50 ${
                    note.type === 'order' ? 'bg-primary/10 text-primary' : 
                    note.type === 'invoice' ? 'bg-success/10 text-success' : 
                    'bg-warning/10 text-warning'
                  }`}>
                    {note.type === 'order' ? <FaBoxOpen /> : note.type === 'invoice' ? <FaFileInvoiceDollar /> : <FaExclamationTriangle />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors cursor-pointer line-clamp-2">
                      {note.title}
                    </p>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{note.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Scorecard Widget */}
            <div className="p-6 border-t border-border">
              <div className="bg-surface-hover/50 p-4 rounded-2xl border border-border relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Supplier SLA Scorecard</p>
                
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-xs font-bold text-text-secondary block">On-Time Delivery</span>
                    <span className="text-sm font-black text-text-primary">98.8%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-text-secondary block">Clearing Index</span>
                    <span className="text-sm font-black text-text-primary">99.2%</span>
                  </div>
                </div>

                <div className="w-full bg-border h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
