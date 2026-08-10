import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Globe, Users, Shield, Package,
  Home, Factory, ShoppingCart, Truck, Handshake, ClipboardList,
  Headphones, BarChart3, CreditCard, FileText, Settings,
  ChevronRight, ChevronDown, Zap, X
} from 'lucide-react';
import useStore from '../../store/useStore';
import { usePermissions } from '../../hooks/usePermissions';
import logoImg from '../../assets/logo.png';

const ICONS = {
  LayoutDashboard, Building2, Globe, Users, Shield, Package,
  Home, Factory, ShoppingCart, Truck, Handshake, ClipboardList,
  Headphones, BarChart3, CreditCard, FileText, Settings, Zap,
};

const navGroups = [
  {
    label: 'Core',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard', module: 'dashboard' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { id: 'companies', label: 'Company Management', icon: 'Building2', path: '/companies', module: 'company-management', roles: ['SUPER_ADMIN', 'EPC_ADMIN'] },
      { id: 'countries', label: 'Country Administration', icon: 'Globe', path: '/countries', module: 'country-administration', roles: ['SUPER_ADMIN', 'EPC_ADMIN', 'COUNTRY_ADMIN'] },
      { id: 'users', label: 'EPC Users', icon: 'Users', path: '/users', module: 'user-management', roles: ['SUPER_ADMIN', 'EPC_ADMIN', 'COUNTRY_ADMIN'] },
      { id: 'roles', label: 'Roles & Permissions', icon: 'Shield', path: '/roles', module: 'role-management', roles: ['SUPER_ADMIN', 'EPC_ADMIN'] },
      { id: 'product-access', label: 'Product Access', icon: 'Package', path: '/product-access', module: 'product-access', roles: ['SUPER_ADMIN', 'EPC_ADMIN', 'COUNTRY_ADMIN'] },
    ],
  },
  {
    label: 'Solar Products',
    items: [
      { id: 'residential-solar', label: 'Residential Solar', icon: 'Home', path: '/residential-solar', module: 'residential-solar' },
      { id: 'commercial-solar', label: 'Commercial Solar', icon: 'Factory', path: '/commercial-solar', module: 'commercial-solar' },
      { id: 'solar-shop', label: 'Solar E-Shop', icon: 'ShoppingCart', path: '/solar-shop', module: 'solar-shop' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'procurement', label: 'Procurement', icon: 'Truck', path: '/procurement', module: 'procurement' },
      { id: 'crm', label: 'CRM', icon: 'Handshake', path: '/crm', module: 'crm' },
      { id: 'orders', label: 'Order Management', icon: 'ClipboardList', path: '/orders', module: 'order-management' },
      { id: 'support', label: 'Service & Support', icon: 'Headphones', path: '/support', module: 'service-support' },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: 'reports', label: 'Reports & Analytics', icon: 'BarChart3', path: '/reports', module: 'reports-analytics' },
      { id: 'subscriptions', label: 'Subscription Plans', icon: 'CreditCard', path: '/subscriptions', module: 'subscription-management', roles: ['SUPER_ADMIN', 'EPC_ADMIN', 'ACCOUNTS'] },
      { id: 'audit-logs', label: 'Audit Logs', icon: 'FileText', path: '/audit-logs', module: 'audit-logs', roles: ['SUPER_ADMIN', 'EPC_ADMIN'] },
      { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings', module: 'settings' },
    ],
  },
];

function NavItem({ item, collapsed, roleCode }) {
  const IconComp = ICONS[item.icon] || Package;
  const isAllowed = !item.roles || item.roles.includes(roleCode) || roleCode === 'SUPER_ADMIN';
  if (!isAllowed) return null;

  return (
    <NavLink to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative
        ${isActive 
          ? 'bg-[#28377F] text-white shadow-md shadow-[#28377F]/20 font-bold' 
          : 'text-[#334155] hover:bg-[#F1F5F9] hover:text-[#28377F]'}`
      }>
      <IconComp size={18} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-[#1E293B] text-white text-xs rounded-lg whitespace-nowrap
          opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-gray-700">
          {item.label}
        </div>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { sidebarCollapsed, mobileDrawerOpen, setMobileDrawerOpen } = useStore();
  const { roleCode } = usePermissions();
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (label) => {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-[#1E293B] border-r border-gray-200/80 select-none shadow-xs">

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-2.5 space-y-4 bg-white">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            !item.roles || item.roles.includes(roleCode) || roleCode === 'SUPER_ADMIN'
          );
          if (visibleItems.length === 0) return null;
          const isGroupCollapsed = collapsedGroups[group.label];

          return (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-2.5 py-1 mb-1.5 text-[11px] font-black text-[#64748B] uppercase tracking-wider hover:text-[#28377F] transition-colors">
                  <span>{group.label}</span>
                  {isGroupCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
              {!isGroupCollapsed && (
                <div className="space-y-1">
                  {visibleItems.map((item) => (
                    <NavItem key={item.id} item={item} collapsed={sidebarCollapsed} roleCode={roleCode} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="px-4 py-3.5 border-t border-gray-100 bg-gray-50/60">
          <div className="text-xs text-[#64748B] font-semibold flex items-center justify-between">
            <span>v1.0.0 · Emergesun</span>
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-64px)] z-20 transition-all duration-300 flex-shrink-0
          ${sidebarCollapsed ? 'w-16' : 'w-64'} hidden lg:flex flex-col`}>
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white flex flex-col border-r border-gray-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <img src={logoImg} alt="EmergeSun" className="h-10 w-auto object-contain max-w-[150px]" />
                <span className="text-[10px] bg-[#28377F] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  EPC
                </span>
              </div>
              <button onClick={() => setMobileDrawerOpen(false)} className="text-[#64748B] p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-4">
              {navGroups.map((group) => {
                const visibleItems = group.items.filter((item) =>
                  !item.roles || item.roles.includes(roleCode) || roleCode === 'SUPER_ADMIN'
                );
                if (visibleItems.length === 0) return null;
                return (
                  <div key={group.label}>
                    <div className="px-2.5 py-1 mb-1.5 text-[11px] font-black text-[#64748B] uppercase tracking-wider">{group.label}</div>
                    <div className="space-y-1">
                      {visibleItems.map((item) => (
                        <NavItem key={item.id} item={item} collapsed={false} roleCode={roleCode} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
