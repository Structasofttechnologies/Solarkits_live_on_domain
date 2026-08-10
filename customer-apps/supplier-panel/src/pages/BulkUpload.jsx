import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import { FaCloudUploadAlt, FaFileCsv, FaFileExcel, FaCheckCircle, FaExclamationTriangle, FaDownload, FaArrowRight } from "react-icons/fa";
import Button from "../components/Button";
import { motion } from "framer-motion";

export default function BulkUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const steps = [
    { title: 'Download Template', desc: 'Get the latest SKU structure.', icon: <FaDownload /> },
    { title: 'Prepare Data', desc: 'Fill in your solar kit details.', icon: <FaFileCsv /> },
    { title: 'Upload & Verify', desc: 'System will validate entries.', icon: <FaCloudUploadAlt /> },
  ];

  const recentUploads = [
    { id: 'UP-9921', file: 'Inverters_Q2_Stock.csv', items: 150, status: 'Completed', date: '2 days ago' },
    { id: 'UP-9918', file: 'Panel_Pricing_Final.xlsx', items: 42, status: 'Completed', date: '5 days ago' },
    { id: 'UP-9915', file: 'Mounting_Structures.csv', items: 200, status: 'Failed', errors: 12, date: '1 week ago' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Bulk Operations" 
        subtitle="Scale your inventory by uploading large datasets via CSV or Excel." 
        icon={FaCloudUploadAlt}
        actions={
          <Button variant="primary" className="rounded-xl px-10 h-12 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20" leftIcon={<FaDownload />}>
            Download Template
          </Button>
        }
      />

      {/* Guide Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, idx) => (
          <div key={idx} className="card p-6 bg-surface border-border flex items-center gap-5 group hover:border-primary/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              {step.icon}
            </div>
            <div>
              <h4 className="text-sm font-black text-text-primary uppercase tracking-tight">{step.title}</h4>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Zone */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card p-12 bg-surface border-2 border-dashed border-border flex flex-col items-center text-center space-y-6 hover:border-primary/50 transition-all cursor-pointer group">
            <div className="w-24 h-24 rounded-3xl bg-surface-hover border-2 border-border flex items-center justify-center text-4xl text-primary/40 group-hover:text-primary transition-colors">
              <FaCloudUploadAlt />
            </div>
            <div className="max-w-xs">
              <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">Drop your data files here</h3>
              <p className="text-sm font-semibold text-text-secondary mt-2">
                Supports .CSV, .XLSX, and .JSON formats. Maximum file size 25MB.
              </p>
            </div>
            <div className="flex gap-4 pt-4">
              <Button variant="primary" className="rounded-xl px-10 h-12 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
                Browse Files
              </Button>
              <Button variant="outline-primary" className="rounded-xl px-10 h-12 font-black uppercase tracking-widest text-xs">
                Download Template
              </Button>
            </div>
          </div>

          {/* Guidelines */}
          <div className="card p-8 bg-surface border-border">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight mb-6">Validation Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              {[
                { label: 'SKU Code', desc: 'Must be unique and alphanumeric.' },
                { label: 'Images', desc: 'Provide valid URL links for products.' },
                { label: 'Taxonomy', desc: 'Categories must match system tags.' },
                { label: 'Stock', desc: 'Integers only. No decimal values.' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-text-primary uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="card bg-surface border-border flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Recent Activity</h3>
            <FaFileExcel className="text-success" />
          </div>
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {recentUploads.map((log, idx) => (
              <div key={idx} className="flex gap-4 group">
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border border-border/50 ${
                  log.status === 'Completed' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}>
                  {log.status === 'Completed' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors cursor-pointer truncate max-w-[120px]">{log.file}</p>
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{log.date}</span>
                  </div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                    {log.items} Items • {log.status} {log.errors && `• ${log.errors} Errors`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 mt-auto">
            <Button variant="outline-primary" fullWidth className="rounded-xl h-12 font-black uppercase tracking-widest text-[10px]" rightIcon={<FaArrowRight />}>
              View Full Logs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
