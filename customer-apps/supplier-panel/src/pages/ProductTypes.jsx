import React from "react";
import PageHeader from "../components/PageHeader";
import { FaLayerGroup, FaBolt, FaHome, FaIndustry, FaPlug, FaTag, FaPlus } from "react-icons/fa";
import Button from "../components/Button";

export default function ProductTypes() {
  const categories = [
    {
      title: 'By System Type',
      icon: <FaPlug />,
      types: ['On-grid Systems', 'Off-grid Systems', 'Hybrid Solar Systems', 'Micro-grids']
    },
    {
      title: 'By Use Case',
      icon: <FaHome />,
      types: ['Residential Rooftop', 'Commercial / Office', 'Industrial Plants', 'Agricultural Pumps']
    },
    {
      title: 'By Capacity',
      icon: <FaBolt />,
      types: ['1kW - 3kW (Small)', '5kW - 10kW (Medium)', '50kW+ (Commercial)', '1MW+ (Mega)']
    },
    {
      title: 'By Package',
      icon: <FaTag />,
      types: ['Basic (Tier 2)', 'Premium (Tier 1)', 'High Efficiency (TopCon)', 'Custom / OEM']
    }
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Solar Kit Taxonomy" 
        subtitle="Define product classifications, categories, and system-level tagging." 
        icon={FaLayerGroup}
        actions={
          <Button 
            variant="primary" 
            className="rounded-xl font-bold text-xs uppercase tracking-widest h-12 shadow-lg shadow-primary/20 px-8"
            leftIcon={<FaPlus />}
          >
            Define New Category
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((cat, idx) => (
          <div key={idx} className="card p-8 bg-surface border-border hover:border-primary/30 transition-all group">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <div>
                <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">{cat.title}</h3>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Active Classification</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cat.types.map((type, tIdx) => (
                <div 
                  key={tIdx} 
                  className="flex items-center justify-between p-4 bg-surface-hover/50 rounded-2xl border border-border group/item hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer"
                >
                  <span className="text-sm font-bold text-text-secondary group-hover/item:text-text-primary transition-colors">{type}</span>
                  <div className="w-2 h-2 rounded-full bg-primary/20 group-hover/item:bg-primary transition-all" />
                </div>
              ))}
              <button className="flex items-center justify-center p-4 bg-surface-hover/30 rounded-2xl border-2 border-dashed border-border text-text-muted hover:text-primary hover:border-primary/30 transition-all group/add">
                <FaPlus className="group-hover/add:rotate-90 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface border-border card p-10 flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-surface-hover border-2 border-border flex items-center justify-center text-3xl text-text-muted">
          <FaLayerGroup />
        </div>
        <div className="max-w-xl">
          <h4 className="text-2xl font-black text-text-primary uppercase tracking-tight">Smart Taxonomy Engine</h4>
          <p className="text-sm font-semibold text-text-secondary mt-2">
            Classification allows EmergeSun to automatically recommend your products to EPC installers based on project constraints. Ensure all kit types are accurately tagged.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline-primary" className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-xs">
            Export Taxonomy
          </Button>
          <Button variant="secondary" className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-xs">
            Sync with Global Catalog
          </Button>
        </div>
      </div>
    </div>
  );
}
