import React from 'react';

const statusConfig = {
  active: { label: 'Active', className: 'badge-success' },
  inactive: { label: 'Inactive', className: 'badge-neutral' },
  suspended: { label: 'Suspended', className: 'badge-error' },
  pending: { label: 'Pending', className: 'badge-warning' },
  expired: { label: 'Expired', className: 'badge-error' },
  success: { label: 'Success', className: 'badge-success' },
  warning: { label: 'Warning', className: 'badge-warning' },
  info: { label: 'Info', className: 'badge-info' },
  draft: { label: 'Draft', className: 'badge-neutral' },
  approved: { label: 'Approved', className: 'badge-success' },
  rejected: { label: 'Rejected', className: 'badge-error' },
};

export function StatusBadge({ status }) {
  const cfg = statusConfig[status?.toLowerCase()] || { label: status, className: 'badge-neutral' };
  return (
    <span className={cfg.className}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      {cfg.label}
    </span>
  );
}

const roleColors = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  EPC_ADMIN: 'bg-primary-50 text-primary border-primary-200',
  COUNTRY_ADMIN: 'bg-blue-50 text-blue-700 border-blue-200',
  SALES: 'bg-amber-50 text-amber-700 border-amber-200',
  SUPPORT: 'bg-teal-50 text-teal-700 border-teal-200',
  OPERATIONS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PROCUREMENT: 'bg-orange-50 text-orange-700 border-orange-200',
  ACCOUNTS: 'bg-green-50 text-green-700 border-green-200',
};

export function RoleBadge({ role, code }) {
  const colorClass = roleColors[code] || 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`badge ${colorClass}`}>{role}</span>
  );
}

export function Avatar({ name, size = 'md', className = '' }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?';
  const sizeClass = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' }[size] || 'w-9 h-9 text-sm';
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <div className={`${sizeClass} ${colors[colorIdx]} text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
}
