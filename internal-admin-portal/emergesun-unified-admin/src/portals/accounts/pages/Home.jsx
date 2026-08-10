import React, { useState } from "react";
import { 
  FaCreditCard, FaFileInvoice, FaCheckCircle, FaExclamationTriangle, 
  FaChartLine, FaArrowUp, FaArrowDown, FaExchangeAlt, FaRegFileAlt, FaCheck, FaTimes
} from 'react-icons/fa';
import { HiOutlineDocumentDownload, HiOutlineTrendingUp } from 'react-icons/hi';
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Home() {
  const navigate = useNavigate();
  const { selectedScope } = useSelector((state) => state.user_slice);
  const clusterName = selectedScope?.clusterName || "No Cluster Selected";

  // Metrics
  const metrics = [
    { title: "Pending Supplier Validations", value: "8 Invoices", desc: "Require 3-way matching", icon: <FaCheckCircle className="text-xl" />, color: "text-amber-500", bg: "bg-amber-500/5", path: "/account-panel/purchase-validation" },
    { title: "Pending Customer Invoices", value: "14 Orders", desc: "4 manual orders need approval", icon: <FaFileInvoice className="text-xl" />, color: "text-blue-500", bg: "bg-blue-500/5", path: "/account-panel/invoices" },
    { title: "Active E-Way Bills", value: "3 Shipments", desc: "All transfers compliant", icon: <FaExchangeAlt className="text-xl" />, color: "text-emerald-500", bg: "bg-emerald-500/5", path: "/account-panel/eway-bills" },
    { title: "Today's Reconciliation", value: "98.2%", desc: "₹12.4L matched against PG logs", icon: <FaChartLine className="text-xl" />, color: "text-purple-500", bg: "bg-purple-500/5", path: "#" }
  ];

  // Quick Approval Action list
  const [pendingApprovals, setPendingApprovals] = useState([
    { id: "MOP-1092", partner: `Solarize India Ltd (${clusterName})`, amount: "₹4,50,000", type: "Manual Transfer", date: "2026-06-15" },
    { id: "MOP-1093", partner: `Vinayaka Green Projects (${clusterName})`, amount: "₹2,10,000", type: "Manual Transfer", date: "2026-06-15" }
  ]);

  const handleQuickApprove = (id) => {
    setPendingApprovals(pendingApprovals.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary to-primary-end rounded-2xl p-6 text-white shadow-md">
        <div className="absolute inset-0 bg-grid-white/10 mask-[linear-gradient(0deg,transparent,black)] pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full font-bold">Cluster Accounts Portal • Active Cluster: {clusterName}</span>
          <h2 className="text-2xl font-black tracking-tight mt-1">Hello, Cluster Accounts Officer</h2>
          <p className="text-xs text-white/80 max-w-md">
            Welcome back. Monitor compliance documentation, release E-Way bills, and reconcile supplier invoices against Goods Receipt Notes.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, idx) => (
          <div 
            key={idx}
            onClick={() => m.path !== "#" && navigate(m.path)}
            className={`card p-5 cursor-pointer transition-all hover:scale-101 border border-border/50 ${m.bg}`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{m.title}</span>
              <div className={`p-2 rounded-xl bg-surface border border-border/40 ${m.color}`}>
                {m.icon}
              </div>
            </div>
            <h3 className="text-xl font-black text-text-primary mt-3">{m.value}</h3>
            <p className="text-xs text-text-secondary mt-1">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Reports & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Approvals Board */}
        <div className="card p-6 space-y-4 lg:col-span-2">
          <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-3 flex justify-between items-center">
            <span>Pending Manual Invoices Approval</span>
            <span className="text-[10px] bg-warning/10 text-warning px-2.5 py-0.5 rounded-full font-bold">Needs Verification</span>
          </h3>

          <div className="divide-y divide-border/60">
            {pendingApprovals.length > 0 ? (
              pendingApprovals.map((app) => (
                <div key={app.id} className="py-3 flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{app.id}</span>
                      <span className="text-text-primary font-semibold">{app.partner}</span>
                    </div>
                    <div className="text-text-secondary">
                      {app.type} • {app.date}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-text-primary">{app.amount}</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleQuickApprove(app.id)}
                        className="p-1.5 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-all active:scale-95"
                        title="Quick Approve"
                      >
                        <FaCheck size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-text-muted italic">
                All manual payment invoice approvals completed!
              </div>
            )}
          </div>
        </div>

        {/* E-way status summary */}
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-3">
            E-Way Bill Status Tracking
          </h3>

          <div className="space-y-4 text-xs">
            {[
              { route: `${clusterName} Hub ➔ Jodhpur Hub`, id: "EWB-982312", status: "Active", progress: "80%" },
              { route: `Ahmedabad Hub ➔ ${clusterName} Hub`, id: "EWB-102911", status: "Completed", progress: "100%" },
              { route: `${clusterName} Hub ➔ Alwar Site`, id: "EWB-881923", status: "Active", progress: "30%" }
            ].map((ewb, idx) => (
              <div key={idx} className="space-y-1.5 p-3 bg-bg rounded-xl border border-border/50">
                <div className="flex justify-between font-bold text-text-primary">
                  <span>{ewb.route}</span>
                  <span className={ewb.status === 'Active' ? 'text-primary' : 'text-success'}>{ewb.status}</span>
                </div>
                <div className="text-[10px] text-text-muted font-mono">{ewb.id}</div>
                
                {/* Progress bar */}
                <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-primary" style={{ width: ewb.progress }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
