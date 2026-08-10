import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import { FaCalculator, FaBolt, FaRupeeSign, FaChartBar, FaFilePdf, FaProjectDiagram } from "react-icons/fa";
import Button from "../components/Button";
import CustomInput from "../components/CustomInput";
import DropdownWithSearchInput from "../components/DropdownWithSearchInput";
import { motion } from "framer-motion";

export default function ProjectEstimator() {
  const [capacity, setCapacity] = useState(10);
  const [costPerKW, setCostPerKW] = useState(45000);
  const [kitType, setKitType] = useState('on-grid');

  const totalCost = capacity * costPerKW;
  const generation = capacity * 4.2 * 365; // Avg 4.2 units per kW per day
  const savings = generation * 8; // Avg 8 rupees per unit

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="B2B Project Estimator" 
        subtitle="Calculate system costs, energy generation, and ROI for large-scale solar projects." 
        icon={FaCalculator}
        actions={
          <Button 
            variant="primary" 
            className="rounded-xl font-bold text-xs uppercase tracking-widest h-12 shadow-lg shadow-primary/20 px-8"
            leftIcon={<FaFilePdf />}
          >
            Generate Quote PDF
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1 card p-8 bg-surface border-border space-y-8">
          <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Project Parameters</h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">System Capacity (kW)</label>
              <CustomInput 
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value))}
                placeholder="Enter capacity"
              />
              <div className="flex justify-between text-xl font-black text-text-primary mt-2">
                <span>{capacity} kW</span>
              </div>
            </div>

            <div className="space-y-2">
              <CustomInput 
                label="Base Cost per kW (₹)"
                type="number"
                value={costPerKW}
                onChange={(e) => setCostPerKW(parseInt(e.target.value))}
                placeholder="45000"
                leftIcon={<FaRupeeSign />}
              />
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Select Kit Configuration</p>
              <DropdownWithSearchInput 
                options={[
                  { value: 'on-grid', text: 'On-Grid System' },
                  { value: 'off-grid', text: 'Off-Grid System' },
                  { value: 'hybrid', text: 'Hybrid System' }
                ]}
                value={kitType}
                onChange={setKitType}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Estimation Results */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="card p-6 bg-primary/5 border-primary/20 flex flex-col items-center text-center">
              <FaBolt className="text-primary text-xl mb-4" />
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Investment</p>
              <h4 className="text-2xl font-black text-text-primary mt-1">₹{(totalCost/100000).toFixed(1)}L</h4>
            </div>
            <div className="card p-6 bg-success/5 border-success/20 flex flex-col items-center text-center">
              <FaChartBar className="text-success text-xl mb-4" />
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Yearly Generation</p>
              <h4 className="text-2xl font-black text-text-primary mt-1">{(generation/1000).toFixed(1)} MWh</h4>
            </div>
            <div className="card p-6 bg-secondary/5 border-secondary/20 flex flex-col items-center text-center">
              <FaCalculator className="text-secondary text-xl mb-4" />
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Payback Period</p>
              <h4 className="text-2xl font-black text-text-primary mt-1">~3.8 Years</h4>
            </div>
          </div>

          <div className="card bg-surface border-border p-8 min-h-[300px] flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-surface-hover border-2 border-border flex items-center justify-center text-3xl text-primary/40 shadow-xl">
              <FaProjectDiagram />
            </div>
            <div className="max-w-md">
              <h4 className="text-xl font-black text-text-primary uppercase tracking-tight">ROI Projection Chart</h4>
              <p className="text-sm font-semibold text-text-secondary mt-2">
                Estimated savings over 25 years: <span className="text-success font-black">₹{(savings * 25 / 100000).toFixed(1)}L</span>
              </p>
            </div>
          </div>

          <div className="bg-surface border-border card p-8 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center text-xl">
                <FaCalculator />
              </div>
              <div>
                <h4 className="text-sm font-black text-text-primary uppercase tracking-tight">Subsidy Integration</h4>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Apply central financial assistance of up to 30%</p>
              </div>
            </div>
            <Button variant="outline-primary" className="rounded-xl h-10 px-6 font-black uppercase tracking-widest text-[10px]">
              Apply Subsidy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
