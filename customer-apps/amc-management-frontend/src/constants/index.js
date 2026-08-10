// src/constants/index.js

export const APP_NAME = 'Emergesun AMC Cloud';
export const APP_TAGLINE = 'Solar Lifecycle Management';
export const APP_VERSION = '1.0.0';

// ─── Routes ────────────────────────────────────────────────────
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ONBOARDING: '/onboarding',
  DASHBOARD: '/dashboard',
  CUSTOMERS: '/customers',
  CUSTOMER_DETAIL: '/customers/:id',
  SITES: '/sites',
  SITE_DETAIL: '/sites/:id',
  AMC_PLANS: '/amc-plans',
  AMC_PLAN_DETAIL: '/amc-plans/:id',
  CONTRACTS: '/contracts',
  CONTRACT_NEW: '/contracts/new',
  CONTRACT_DETAIL: '/contracts/:id',
  SCHEDULE: '/schedule',
  TECHNICIANS: '/technicians',
  TECHNICIAN_DETAIL: '/technicians/:id',
  CLEANING: '/cleaning',
  MAINTENANCE: '/maintenance',
  TICKETS: '/tickets',
  TICKET_DETAIL: '/tickets/:id',
  MONITORING: '/monitoring',
  SITE_MONITORING: '/monitoring/:siteId',
  AI_ANALYTICS: '/ai-analytics',
  INVENTORY: '/inventory',
  WARRANTIES: '/warranties',
  FINANCE: '/finance',
  INVOICES: '/invoices',
  INVOICE_DETAIL: '/invoices/:id',
  REPORTS: '/reports',
  NOTIFICATIONS: '/notifications',
  INTEGRATIONS: '/integrations',
  TEAM: '/team',
  ROLES: '/roles',
  SETTINGS: '/settings',
  SUBSCRIPTION: '/subscription',
  CUSTOMER_PORTAL: '/customer-portal',
  TECHNICIAN_APP: '/technician-app',
  NOT_FOUND: '*',
};

// ─── User Roles ────────────────────────────────────────────────
export const ROLES = {
  EPC_OWNER: 'epc_owner',
  SUPER_ADMIN: 'super_admin',
  BRANCH_ADMIN: 'branch_admin',
  AMC_MANAGER: 'amc_manager',
  SERVICE_MANAGER: 'service_manager',
  OPERATIONS_MANAGER: 'operations_manager',
  TECHNICIAN: 'technician',
  CLEANING_SUPERVISOR: 'cleaning_supervisor',
  FINANCE_USER: 'finance_user',
  SUPPORT_EXECUTIVE: 'support_executive',
  VIEWER: 'viewer',
};

export const ROLE_LABELS = {
  [ROLES.EPC_OWNER]: 'EPC Owner',
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.BRANCH_ADMIN]: 'Branch Admin',
  [ROLES.AMC_MANAGER]: 'AMC Manager',
  [ROLES.SERVICE_MANAGER]: 'Service Manager',
  [ROLES.OPERATIONS_MANAGER]: 'Operations Manager',
  [ROLES.TECHNICIAN]: 'Technician',
  [ROLES.CLEANING_SUPERVISOR]: 'Cleaning Supervisor',
  [ROLES.FINANCE_USER]: 'Finance User',
  [ROLES.SUPPORT_EXECUTIVE]: 'Support Executive',
  [ROLES.VIEWER]: 'Viewer',
};

// ─── Permissions ────────────────────────────────────────────────
export const PERMISSIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve',
  ASSIGN: 'assign',
  EXPORT: 'export',
  MANAGE_SETTINGS: 'manage_settings',
};

// Role-based permission matrix
export const ROLE_PERMISSIONS = {
  [ROLES.EPC_OWNER]: Object.values(PERMISSIONS),
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.BRANCH_ADMIN]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT, PERMISSIONS.APPROVE, PERMISSIONS.ASSIGN, PERMISSIONS.EXPORT],
  [ROLES.AMC_MANAGER]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT, PERMISSIONS.APPROVE, PERMISSIONS.EXPORT],
  [ROLES.SERVICE_MANAGER]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT, PERMISSIONS.ASSIGN],
  [ROLES.OPERATIONS_MANAGER]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT, PERMISSIONS.ASSIGN, PERMISSIONS.EXPORT],
  [ROLES.TECHNICIAN]: [PERMISSIONS.VIEW, PERMISSIONS.EDIT],
  [ROLES.CLEANING_SUPERVISOR]: [PERMISSIONS.VIEW, PERMISSIONS.EDIT, PERMISSIONS.ASSIGN],
  [ROLES.FINANCE_USER]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT, PERMISSIONS.EXPORT],
  [ROLES.SUPPORT_EXECUTIVE]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT],
  [ROLES.VIEWER]: [PERMISSIONS.VIEW],
};

// ─── Contract Statuses ─────────────────────────────────────────
export const CONTRACT_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled',
};

// ─── Ticket Statuses ───────────────────────────────────────────
export const TICKET_STATUS = {
  NEW: 'new',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  WAITING_CUSTOMER: 'waiting_customer',
  WAITING_PART: 'waiting_part',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  REOPENED: 'reopened',
  ESCALATED: 'escalated',
};

// ─── Visit Statuses ────────────────────────────────────────────
export const VISIT_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  MISSED: 'missed',
  RESCHEDULED: 'rescheduled',
  CANCELLED: 'cancelled',
};

// ─── Plant Types ───────────────────────────────────────────────
export const PLANT_TYPES = {
  RESIDENTIAL: 'residential',
  COMMERCIAL: 'commercial',
  INDUSTRIAL: 'industrial',
  UTILITY: 'utility',
};

// ─── Service Types ─────────────────────────────────────────────
export const SERVICE_TYPES = {
  CLEANING: 'cleaning',
  PREVENTIVE_MAINTENANCE: 'preventive_maintenance',
  CORRECTIVE_MAINTENANCE: 'corrective_maintenance',
  INSPECTION: 'inspection',
  EMERGENCY: 'emergency',
  SITE_SURVEY: 'site_survey',
};

// ─── Monitoring Statuses ───────────────────────────────────────
export const MONITORING_STATUS = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance',
  UNAVAILABLE: 'data_unavailable',
};

// ─── Priority Levels ───────────────────────────────────────────
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// ─── Invoice Statuses ─────────────────────────────────────────
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  PARTIALLY_PAID: 'partially_paid',
  CANCELLED: 'cancelled',
};

// ─── Notification Types ────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  VISIT: 'visit',
  CONTRACT: 'contract',
  INVOICE: 'invoice',
  ALERT: 'alert',
  TICKET: 'ticket',
  TECHNICIAN: 'technician',
  STOCK: 'stock',
  SYSTEM: 'system',
};

// ─── AMC Plans ────────────────────────────────────────────────
export const AMC_PLAN_TYPES = {
  BASIC: 'basic',
  CLEANING: 'cleaning',
  CLEANING_MAINTENANCE: 'cleaning_maintenance',
  POWER_WARRANTY: 'power_warranty',
};

// ─── Indian States ────────────────────────────────────────────
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep',
  'Puducherry',
];

export * from './countries';

