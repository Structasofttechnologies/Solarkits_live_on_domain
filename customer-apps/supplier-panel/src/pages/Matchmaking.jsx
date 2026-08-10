import React from "react";
import PageHeader from "../components/PageHeader";
import { FaProjectDiagram, FaRocket, FaHandshake, FaArrowRight, FaMapMarkerAlt, FaBolt, FaLayerGroup } from "react-icons/fa";
import Button from "../components/Button";
import { motion } from "framer-motion";

export default function Matchmaking() {
  const matches = [
    { 
      project: 'Global Tech Park Rooftop', 
      type: 'Commercial', 
      capacity: '250kW', 
      location: 'Bangalore, KA', 
      matchScore: '98%', 
      requirements: ['TopCon Panels', 'Hybrid Inverters']
    },
    { 
      project: 'Eco-Smart Residential Society', 
      type: 'Residential', 
      capacity: '50kW', 
      location: 'Pune, MH', 
      matchScore: '92%', 
      requirements: ['Mono-PERC', 'On-Grid Inverters']
    },
    { 
      project: 'Heritage Hotel Solar Retrofit', 
      type: 'Commercial', 
      capacity: '120kW', 
      location: 'Jaipur, RJ', 
      matchScore: '85%', 
      requirements: ['Custom Mounting', '100kW+ Inverters']
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Matchmaking Engine" 
        subtitle="AI-driven project lead matching based on your inventory specialization and engineering capabilities." 
        icon={FaHandshake}
        actions={
          <div className="flex gap-4">
            <Button variant="outline-primary" className="rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-widest">
              Preferences
            </Button>
            <Button variant="primary" className="rounded-xl h-12 px-8 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20" leftIcon={<FaRocket />}>
              Active Leads
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6">
        {matches.map((match, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card p-8 bg-surface border-border flex flex-col lg:flex-row lg:items-center justify-between gap-8 group hover:border-primary/30 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-full w-24 gradient-primary opacity-5 group-hover:opacity-10 transition-opacity" />
            
            <div className="flex items-center gap-6 flex-1">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                <FaProjectDiagram />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-text-primary uppercase tracking-tight group-hover:text-primary transition-colors">{match.project}</h3>
                  <span className="text-[10px] font-black text-success uppercase bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                    {match.matchScore} Match
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-[10px] font-black text-text-muted uppercase tracking-widest">
                  <div className="flex items-center gap-1.5"><FaLayerGroup className="text-primary" /> {match.type}</div>
                  <div className="flex items-center gap-1.5"><FaBolt className="text-primary" /> {match.capacity}</div>
                  <div className="flex items-center gap-1.5"><FaMapMarkerAlt className="text-primary" /> {match.location}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 max-w-sm">
              {match.requirements.map((req, rIdx) => (
                <span key={rIdx} className="px-4 py-2 bg-surface-hover rounded-xl border border-border text-[10px] font-black text-text-secondary uppercase tracking-widest">
                  {req}
                </span>
              ))}
            </div>

            <Button variant="primary" className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 shrink-0" rightIcon={<FaArrowRight />}>
              Express Interest
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Matchmaking Info */}
      <div className="card p-10 bg-slate-900 border-border flex flex-col md:flex-row items-center gap-10">
        <div className="w-24 h-24 rounded-[2rem] bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-4xl text-primary shadow-2xl">
          <FaRocket />
        </div>
        <div className="flex-1 text-center md:text-left space-y-3">
          <h4 className="text-2xl font-black text-white uppercase tracking-tight tracking-tighter">Automated Project Matchmaking</h4>
          <p className="text-sm font-semibold text-slate-400 leading-relaxed max-w-2xl">
            Our engine analyzes project requirements from EPC partners and matches them against your <span className="text-primary">Stock Availability</span> and <span className="text-primary">Technical Specialization</span>. 
            Reduce your CAC (Customer Acquisition Cost) by getting high-intent leads delivered to your dashboard.
          </p>
        </div>
        <Button variant="primary" className="rounded-xl h-14 px-10 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
          Configure Preferences
        </Button>
      </div>
    </div>
  );
}
