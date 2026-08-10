import { roles } from '../mocks/roles';
import useStore from '../store/useStore';

/**
 * Get the role object for the effective role code
 */
export const getRoleByCode = (code) => roles.find((r) => r.code === code);

/**
 * Check if user has permission for a module+action
 */
export const hasPermission = (roleCode, module, action) => {
  const role = getRoleByCode(roleCode);
  if (!role) return false;
  const modulePerms = role.permissions[module];
  if (!modulePerms) return false;
  return modulePerms.includes(action);
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (roleCode) => {
  const role = getRoleByCode(roleCode);
  return role?.permissions || {};
};

/**
 * Check if the current user has access to a specific sidebar module
 */
export const canAccessModule = (roleCode, module) => {
  const role = getRoleByCode(roleCode);
  if (!role) return false;
  return !!role.permissions[module];
};

/**
 * React hook for permission checks
 */
export const usePermissions = () => {
  const store = useStore();
  const roleCode = store.getEffectiveRole();

  return {
    roleCode,
    can: (module, action) => hasPermission(roleCode, module, action),
    canAccess: (module) => canAccessModule(roleCode, module),
    permissions: getRolePermissions(roleCode),
    isSuperAdmin: roleCode === 'SUPER_ADMIN',
    isEpcAdmin: roleCode === 'EPC_ADMIN',
    isCountryAdmin: roleCode === 'COUNTRY_ADMIN',
  };
};

/**
 * Permission-gated sidebar items
 */
export const getVisibleSidebarItems = (roleCode) => {
  const allItems = [
    { id: 'dashboard', module: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
    { id: 'companies', module: 'company-management', label: 'Company Management', icon: 'Building2', path: '/companies', roles: ['SUPER_ADMIN', 'EPC_ADMIN'] },
    { id: 'countries', module: 'country-administration', label: 'Country Administration', icon: 'Globe', path: '/countries', roles: ['SUPER_ADMIN', 'EPC_ADMIN', 'COUNTRY_ADMIN'] },
    { id: 'users', module: 'user-management', label: 'EPC Users', icon: 'Users', path: '/users', roles: ['SUPER_ADMIN', 'EPC_ADMIN', 'COUNTRY_ADMIN'] },
    { id: 'roles', module: 'role-management', label: 'Roles & Permissions', icon: 'Shield', path: '/roles', roles: ['SUPER_ADMIN', 'EPC_ADMIN'] },
    { id: 'product-access', module: 'product-access', label: 'Product Access', icon: 'Package', path: '/product-access', roles: ['SUPER_ADMIN', 'EPC_ADMIN', 'COUNTRY_ADMIN'] },
    { id: 'residential-solar', module: 'residential-solar', label: 'Residential Solar', icon: 'Home', path: '/residential-solar' },
    { id: 'commercial-solar', module: 'commercial-solar', label: 'Commercial Solar', icon: 'Factory', path: '/commercial-solar' },
    { id: 'solar-shop', module: 'solar-shop', label: 'Solar E-Shop', icon: 'ShoppingCart', path: '/solar-shop' },
    { id: 'procurement', module: 'procurement', label: 'Procurement', icon: 'Truck', path: '/procurement' },
    { id: 'crm', module: 'crm', label: 'CRM', icon: 'Handshake', path: '/crm' },
    { id: 'orders', module: 'order-management', label: 'Order Management', icon: 'ClipboardList', path: '/orders' },
    { id: 'support', module: 'service-support', label: 'Service & Support', icon: 'HeadphonesIcon', path: '/support' },
    { id: 'reports', module: 'reports-analytics', label: 'Reports & Analytics', icon: 'BarChart3', path: '/reports' },
    { id: 'subscriptions', module: 'subscription-management', label: 'Subscription Plans', icon: 'CreditCard', path: '/subscriptions', roles: ['SUPER_ADMIN', 'EPC_ADMIN', 'ACCOUNTS'] },
    { id: 'audit-logs', module: 'audit-logs', label: 'Audit Logs', icon: 'FileText', path: '/audit-logs', roles: ['SUPER_ADMIN', 'EPC_ADMIN'] },
    { id: 'settings', module: 'settings', label: 'Settings', icon: 'Settings', path: '/settings', roles: ['SUPER_ADMIN', 'EPC_ADMIN', 'COUNTRY_ADMIN'] },
  ];

  return allItems.filter((item) => {
    if (!item.roles) return canAccessModule(roleCode, item.module);
    return item.roles.includes(roleCode) || roleCode === 'SUPER_ADMIN';
  });
};
