import React from "react";
import PageHeader from "../components/PageHeader";
import { FaTicketAlt, FaPlus, FaSearch, FaFilter, FaClock, FaCheckCircle, FaUserCircle } from "react-icons/fa";
import Button from "../components/Button";
import { motion } from "framer-motion";

export default function SupportTickets() {
  const tickets = [
    { id: 'TKT-1002', subject: 'Inverter Warranty Registration Issue', category: 'Technical', priority: 'High', status: 'Open', date: '2h ago' },
    { id: 'TKT-1001', subject: 'Payout Delay for ORD-8821', category: 'Finance', priority: 'Medium', status: 'Resolved', date: '1 day ago' },
    { id: 'TKT-0998', subject: 'Incorrect SKU Category Mapping', category: 'Catalog', priority: 'Low', status: 'Closed', date: '5 days ago' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Support & Escalations" 
        subtitle="Submit technical issues, billing disputes, or catalog requests to our partner success team." 
        icon={FaTicketAlt}
        actions={
          <Button 
            variant="primary" 
            className="rounded-xl font-bold text-xs uppercase tracking-widest h-12 shadow-lg shadow-primary/20 px-8"
            leftIcon={<FaPlus />}
          >
            Create New Ticket
          </Button>
        }
      />

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search ticket IDs or subjects..." 
            className="w-full h-12 bg-surface border-2 border-border focus:border-primary/30 rounded-xl pl-12 pr-4 text-sm font-bold transition-all outline-none"
          />
        </div>
        <div className="flex gap-4">
          <Button variant="outline-primary" className="rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-widest" leftIcon={<FaFilter />}>
            All Status
          </Button>
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        {tickets.map((t, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card p-6 bg-surface border-border flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-primary/30 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                t.status === 'Open' ? 'bg-primary/10 text-primary' : t.status === 'Resolved' ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'
              }`}>
                <FaTicketAlt />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-black text-text-primary uppercase tracking-tight group-hover:text-primary transition-colors">{t.subject}</h3>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                    t.priority === 'High' ? 'bg-danger/10 text-danger' : t.priority === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                  }`}>
                    {t.priority} Priority
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black text-text-muted uppercase tracking-widest">
                  <span>ID: {t.id}</span>
                  <span>•</span>
                  <span>{t.category}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <FaClock className="text-[8px]" />
                    {t.date}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-surface border-2 border-border flex items-center justify-center text-lg text-primary">
                    <FaUserCircle />
                  </div>
                ))}
              </div>
              <div className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest ${
                t.status === 'Open' ? 'border-primary/30 text-primary bg-primary/5' : 
                t.status === 'Resolved' ? 'border-success/30 text-success bg-success/5' : 
                'border-border text-text-muted bg-surface-hover/30'
              }`}>
                {t.status}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Support Banner */}
      <div className="card p-10 bg-surface border-border flex flex-col md:flex-row items-center gap-10">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-4xl shadow-xl">
          <FaCheckCircle />
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h4 className="text-2xl font-black text-text-primary uppercase tracking-tight">Dedicated Partner Success</h4>
          <p className="text-sm font-semibold text-text-secondary leading-relaxed max-w-xl">
            Our technical support team is available 24/7 for Enterprise partners. Expect a response within <span className="text-primary font-black">2 hours</span> for high-priority tickets.
          </p>
        </div>
        <Button variant="outline-primary" className="rounded-xl h-14 px-10 font-black uppercase tracking-widest text-xs">
          Live Chat Support
        </Button>
      </div>
    </div>
  );
}
