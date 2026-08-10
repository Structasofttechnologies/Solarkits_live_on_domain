import React from "react";
import PageHeader from "../components/PageHeader";
import { FaProjectDiagram, FaHome, FaIndustry, FaSeedling, FaHospital, FaPlus, FaChevronRight, FaRegChartBar } from "react-icons/fa";
import { MdOutlineArchitecture } from "react-icons/md";
import Button from "../components/Button";

export default function ProjectTypes() {
  const projects = [
    {
      name: 'Residential Projects',
      desc: 'Individual home rooftops and apartment complexes.',
      icon: <FaHome />,
      color: 'bg-primary/10 text-primary',
      stages: ['Site Survey', 'Quotation', 'Installation', 'Subsidy']
    },
    {
      name: 'Commercial Projects',
      desc: 'Offices, malls, and small-scale business parks.',
      icon: <MdOutlineArchitecture />,
      color: 'bg-secondary/10 text-secondary',
      stages: ['Feasibility', 'Structure Design', 'Net Metering', 'AMC']
    },
    {
      name: 'Industrial Projects',
      desc: 'Large manufacturing plants and power-hungry units.',
      icon: <FaIndustry />,
      color: 'bg-warning/10 text-warning',
      stages: ['Load Analysis', 'PPA Signing', 'EPC Execution', 'O&M']
    },
    {
      name: 'Agricultural Projects',
      desc: 'Solar water pumps and rural irrigation solutions.',
      icon: <FaSeedling />,
      color: 'bg-success/10 text-success',
      stages: ['Pump Sizing', 'Installation', 'Govt Verification']
    }
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="B2B Project Frameworks" 
        subtitle="Configure specialized workflows for different solar installation segments." 
        icon={FaProjectDiagram}
        actions={
          <Button 
            variant="primary" 
            className="rounded-xl font-bold text-xs uppercase tracking-widest h-12 shadow-lg shadow-primary/20 px-8"
            leftIcon={<FaPlus />}
          >
            New Project Workflow
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6">
        {projects.map((project, idx) => (
          <div key={idx} className="card p-8 bg-surface border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group hover:border-primary/30 transition-all">
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform ${project.color}`}>
                {project.icon}
              </div>
              <div className="max-w-xs">
                <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">{project.name}</h3>
                <p className="text-sm font-bold text-text-secondary mt-1">{project.desc}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {project.stages.map((stage, sIdx) => (
                <div key={sIdx} className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-surface-hover/50 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest text-text-muted">
                    {stage}
                  </div>
                  {sIdx < project.stages.length - 1 && <FaChevronRight className="text-border text-[8px]" />}
                </div>
              ))}
            </div>

            <div className="flex gap-3 shrink-0">
              <Button variant="outline-primary" className="rounded-xl h-12 w-12 flex items-center justify-center p-0">
                <FaRegChartBar />
              </Button>
              <Button variant="outline-primary" className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px]">
                Config Workflow
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Integration Notice */}
      <div className="bg-gradient-to-r from-primary/10 via-surface to-secondary/10 border-2 border-border/50 rounded-[2.5rem] p-10 flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-surface shadow-xl flex items-center justify-center text-3xl text-primary">
          <FaProjectDiagram />
        </div>
        <div className="max-w-2xl">
          <h4 className="text-2xl font-black text-text-primary uppercase tracking-tight">Project Pipeline Integration</h4>
          <p className="text-sm font-semibold text-text-secondary mt-3">
            Linking project types to your inventory allows for automated BOM (Bill of Materials) generation. 
            When an EPC partner selects a <span className="text-primary">Commercial Project</span>, the system will prioritize your matched high-capacity inventory.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="primary" className="rounded-xl h-14 px-10 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
            Map Inventory to Projects
          </Button>
          <Button variant="outline-secondary" className="rounded-xl h-14 px-10 font-black uppercase tracking-widest text-xs">
            View Stage Analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
