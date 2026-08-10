import React, { useState } from "react";
import { useSelector } from "react-redux";
import PageHeader from "../components/PageHeader";
import { FaBoxOpen, FaPlus, FaSearch, FaFilter, FaEllipsisV, FaCheckCircle, FaExclamationTriangle, FaLock } from "react-icons/fa";
import Button from "../components/Button";
import DropdownWithSearchInput from "../components/DropdownWithSearchInput";
import { motion } from "framer-motion";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');

  const products = [
    { id: 'SKU-001', name: '5kW On-Grid Solar Inverter', type: 'Inverter', price: '₹45,000', stock: 15, status: 'Active' },
    { id: 'SKU-002', name: '450W Monocrystalline Panel', type: 'Panel', price: '₹12,500', stock: 120, status: 'Active' },
    { id: 'SKU-003', name: 'Hybrid Storage System 10kWh', type: 'Storage', price: '₹2,80,000', stock: 4, status: 'Low Stock' },
    { id: 'SKU-004', name: 'Solar Mounting Structure (Rooftop)', type: 'Structure', price: '₹8,000', stock: 50, status: 'Active' },
    { id: 'SKU-005', name: 'DC Cables 4sqmm (100m Roll)', type: 'Wiring', price: '₹3,200', stock: 0, status: 'Out of Stock' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Product Catalog" 
        subtitle="Manage your listed solar equipment and technical specifications." 
        icon={FaBoxOpen}
        actions={
          <Button 
            variant="primary" 
            className="rounded-xl font-bold text-xs uppercase tracking-widest h-12 shadow-lg shadow-primary/20 px-8"
            leftIcon={<FaPlus />}
          >
            Add New Product
          </Button>
        }
      />

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search SKUs, names, or categories..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 bg-surface border-2 border-border focus:border-primary/30 rounded-xl pl-12 pr-4 text-sm font-bold transition-all outline-none"
          />
        </div>
        <div className="flex gap-4">
          <Button variant="outline-primary" className="rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-widest" leftIcon={<FaFilter />}>
            Filter
          </Button>
          <div className="h-12 w-px bg-border hidden md:block" />
          <DropdownWithSearchInput 
            options={[
              { value: 'all', text: 'All Categories' },
              { value: 'inverters', text: 'Inverters' },
              { value: 'panels', text: 'Panels' },
              { value: 'storage', text: 'Storage' }
            ]}
            value={category}
            onChange={setCategory}
            className="w-48"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 gap-4">
        <div className="card bg-surface border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-hover/50 text-[10px] font-black text-text-muted uppercase tracking-widest">
                  <th className="px-6 py-4">Product Identity</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Commercials</th>
                  <th className="px-6 py-4">Availability</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {products.map((product, idx) => (
                  <tr key={idx} className="hover:bg-surface-hover/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-surface-hover border border-border flex items-center justify-center text-lg text-primary shadow-sm">
                          <FaBoxOpen />
                        </div>
                        <div>
                          <p className="text-sm font-black text-text-primary uppercase tracking-tight group-hover:text-primary transition-colors">{product.name}</p>
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-text-secondary uppercase">{product.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-text-primary">{product.price}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="h-1.5 w-24 bg-surface-hover rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${product.stock > 20 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'}`} 
                            style={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{product.stock} units in stock</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {product.status === 'Active' ? <FaCheckCircle className="text-success text-xs" /> : <FaExclamationTriangle className="text-warning text-xs" />}
                        <span className={`text-[10px] font-black uppercase tracking-tight ${product.status === 'Active' ? 'text-success' : 'text-warning'}`}>
                          {product.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-muted">
                        <FaEllipsisV />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
