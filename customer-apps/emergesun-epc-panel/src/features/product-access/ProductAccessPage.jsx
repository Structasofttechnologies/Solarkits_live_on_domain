import React, { useState } from 'react';
import { Package, Users, Globe, Settings, Eye, Home, Factory, ShoppingCart, Truck, Handshake, ClipboardList, Headphones, BarChart3 } from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { StatusBadge } from '../../components/common/Badges';
import toast from 'react-hot-toast';

const PRODUCTS = [
  { id: 'residential-solar', name: 'Residential Solar', icon: Home, desc: 'Manage residential solar leads, surveys, quotes, and installations.', activeUsers: 120, countries: 5, subscription: true, status: 'active', color: 'bg-amber-50 text-amber-600' },
  { id: 'commercial-solar', name: 'Commercial Solar', icon: Factory, desc: 'Handle commercial projects, proposals, site assessments, and contracts.', activeUsers: 95, countries: 6, subscription: true, status: 'active', color: 'bg-blue-50 text-blue-600' },
  { id: 'solar-shop', name: 'Solar E-Shop', icon: ShoppingCart, desc: 'Online marketplace for solar products, panels, inverters and accessories.', activeUsers: 63, countries: 4, subscription: true, status: 'active', color: 'bg-purple-50 text-purple-600' },
  { id: 'procurement', name: 'Procurement', icon: Truck, desc: 'Purchase requests, supplier management, and procurement workflows.', activeUsers: 48, countries: 4, subscription: false, status: 'active', color: 'bg-orange-50 text-orange-600' },
  { id: 'crm', name: 'CRM', icon: Handshake, desc: 'Lead tracking, opportunity management, follow-ups, and pipeline analytics.', activeUsers: 87, countries: 7, subscription: false, status: 'active', color: 'bg-green-50 text-green-600' },
  { id: 'order-management', name: 'Order Management', icon: ClipboardList, desc: 'Track orders from placement through delivery with full status visibility.', activeUsers: 42, countries: 5, subscription: false, status: 'active', color: 'bg-indigo-50 text-indigo-600' },
  { id: 'service-support', name: 'Service & Support', icon: Headphones, desc: 'Ticket management, SLA tracking, and customer satisfaction reporting.', activeUsers: 38, countries: 6, subscription: false, status: 'active', color: 'bg-teal-50 text-teal-600' },
  { id: 'reports-analytics', name: 'Reports & Analytics', icon: BarChart3, desc: 'Comprehensive dashboards and exportable reports across all modules.', activeUsers: 25, countries: 8, subscription: true, status: 'active', color: 'bg-rose-50 text-rose-600' },
];

const ACCESS_LEVELS = ['No Access', 'View Only', 'Standard', 'Full Access', 'Custom'];

const mockMatrix = {
  roles: ['Super Admin', 'EPC Admin', 'Country Admin', 'Sales', 'Support', 'Operations', 'Procurement', 'Accounts'],
  products: PRODUCTS.map((p) => p.name),
  cells: {},
};
mockMatrix.roles.forEach((r, ri) => {
  mockMatrix.products.forEach((p, pi) => {
    if (r === 'Super Admin') mockMatrix.cells[`${ri}-${pi}`] = 'Full Access';
    else if (r === 'EPC Admin') mockMatrix.cells[`${ri}-${pi}`] = 'Standard';
    else if (r === 'Country Admin') mockMatrix.cells[`${ri}-${pi}`] = pi < 4 ? 'Standard' : 'View Only';
    else if (r === 'Sales' && (pi === 4 || pi === 0 || pi === 1)) mockMatrix.cells[`${ri}-${pi}`] = 'Standard';
    else if (r === 'Support' && pi === 6) mockMatrix.cells[`${ri}-${pi}`] = 'Standard';
    else if (r === 'Operations' && (pi === 5 || pi === 0 || pi === 1)) mockMatrix.cells[`${ri}-${pi}`] = 'Standard';
    else if (r === 'Procurement' && (pi === 3 || pi === 2)) mockMatrix.cells[`${ri}-${pi}`] = 'Full Access';
    else if (r === 'Accounts' && (pi === 7)) mockMatrix.cells[`${ri}-${pi}`] = 'Standard';
    else mockMatrix.cells[`${ri}-${pi}`] = 'No Access';
  });
});

const levelColors = {
  'No Access': 'bg-gray-100 text-gray-400',
  'View Only': 'bg-blue-50 text-blue-500',
  'Standard': 'bg-amber-50 text-amber-600',
  'Full Access': 'bg-green-50 text-green-700',
  'Custom': 'bg-purple-50 text-purple-600',
};

export default function ProductAccessPage() {
  const [view, setView] = useState('cards');
  const [cells, setCells] = useState(mockMatrix.cells);

  const cycleLevel = (key) => {
    const curr = ACCESS_LEVELS.indexOf(cells[key] || 'No Access');
    setCells((prev) => ({ ...prev, [key]: ACCESS_LEVELS[(curr + 1) % ACCESS_LEVELS.length] }));
    toast.success('Access level updated');
  };

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: 'Product Access' }]} />
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-solar-navy">Product Access Management</h1>
          <p className="text-solar-slate text-sm mt-0.5">Assign and manage product access by role, company, or user</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('cards')} className={`btn-sm ${view === 'cards' ? 'btn-primary' : 'btn-outline'}`}>Product Cards</button>
          <button onClick={() => setView('matrix')} className={`btn-sm ${view === 'matrix' ? 'btn-primary' : 'btn-outline'}`}>Access Matrix</button>
        </div>
      </div>

      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PRODUCTS.map((product) => {
            const Icon = product.icon;
            return (
              <div key={product.id} className="card p-5 card-hover group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${product.color}`}>
                    <Icon size={20} />
                  </div>
                  <StatusBadge status={product.status} />
                </div>
                <h3 className="font-semibold text-solar-navy mb-1">{product.name}</h3>
                <p className="text-xs text-solar-slate mb-4 line-clamp-2">{product.desc}</p>
                <div className="flex items-center justify-between text-xs text-solar-slate mb-3">
                  <div className="flex items-center gap-1"><Users size={12} />{product.activeUsers} users</div>
                  <div className="flex items-center gap-1"><Globe size={12} />{product.countries} countries</div>
                  {product.subscription && <span className="badge-primary">Subscription</span>}
                </div>
                <button className="btn-outline w-full btn-sm group-hover:btn-primary transition-all">
                  <Settings size={13} /> Manage Access
                </button>
              </div>
            );
          })}
        </div>
      )}

      {view === 'matrix' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-solar-border">
            <h3 className="font-semibold text-solar-navy">Role × Product Access Matrix</h3>
            <p className="text-xs text-solar-slate mt-0.5">Click any cell to cycle through access levels: No Access → View Only → Standard → Full Access</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-solar-slate border-b border-solar-border min-w-[140px]">Role</th>
                  {mockMatrix.products.map((p) => (
                    <th key={p} className="px-2 py-3 text-center font-semibold text-solar-slate border-b border-solar-border min-w-[100px]">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockMatrix.roles.map((role, ri) => (
                  <tr key={role} className="hover:bg-gray-50 border-b border-gray-50">
                    <td className="px-4 py-3 font-semibold text-solar-navy">{role}</td>
                    {mockMatrix.products.map((_, pi) => {
                      const key = `${ri}-${pi}`;
                      const level = cells[key] || 'No Access';
                      return (
                        <td key={pi} className="px-2 py-2 text-center">
                          <button onClick={() => cycleLevel(key)}
                            className={`px-2 py-1 rounded-md text-xs font-medium w-full transition-all hover:opacity-90 ${levelColors[level]}`}>
                            {level}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-solar-border flex items-center gap-4 flex-wrap">
            {Object.entries(levelColors).map(([level, cls]) => (
              <div key={level} className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{level}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
