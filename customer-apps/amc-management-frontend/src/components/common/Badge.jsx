// src/components/common/Badge.jsx

const variantConfig = {
  active: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  pending: { bg: 'bg-warning-50', text: 'text-warning-700', dot: 'bg-warning' },
  expired: { bg: 'bg-danger-50', text: 'text-danger-700', dot: 'bg-danger' },
  expiring: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  suspended: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-500' },
  cancelled: { bg: 'bg-danger-50', text: 'text-danger-600', dot: 'bg-danger' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  paid: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success' },
  overdue: { bg: 'bg-danger-50', text: 'text-danger-700', dot: 'bg-danger' },
  partial: { bg: 'bg-warning-50', text: 'text-warning-700', dot: 'bg-warning' },
  sent: { bg: 'bg-info-50', text: 'text-info-700', dot: 'bg-info' },
  new: { bg: 'bg-info-50', text: 'text-info-700', dot: 'bg-info' },
  assigned: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  in_progress: { bg: 'bg-warning-50', text: 'text-warning-700', dot: 'bg-warning-500' },
  resolved: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  escalated: { bg: 'bg-danger-50', text: 'text-danger-700', dot: 'bg-danger' },
  waiting_customer: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  waiting_part: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  reopened: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  scheduled: { bg: 'bg-info-50', text: 'text-info-700', dot: 'bg-info' },
  completed: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success' },
  missed: { bg: 'bg-danger-50', text: 'text-danger-700', dot: 'bg-danger' },
  rescheduled: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  healthy: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success' },
  warning: { bg: 'bg-warning-50', text: 'text-warning-700', dot: 'bg-warning' },
  critical: { bg: 'bg-danger-50', text: 'text-danger-700', dot: 'bg-danger' },
  offline: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-500' },
  maintenance: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  available: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success' },
  on_job: { bg: 'bg-info-50', text: 'text-info-700', dot: 'bg-info' },
  on_leave: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  low: { bg: 'bg-gray-100', text: 'text-gray-600' },
  medium: { bg: 'bg-warning-50', text: 'text-warning-700' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700' },
  low_stock: { bg: 'bg-warning-50', text: 'text-warning-700', dot: 'bg-warning' },
  in_stock: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success' },
  out_of_stock: { bg: 'bg-danger-50', text: 'text-danger-700', dot: 'bg-danger' },
  connected: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success' },
  coming_soon: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  needs_attention: { bg: 'bg-warning-50', text: 'text-warning-700', dot: 'bg-warning' },
};

const sizeClasses = {
  xs: 'px-1.5 py-0.5 text-xxs',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const formatLabel = (str) => {
  if (!str) return '';
  return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function Badge({
  status,
  label,
  variant,
  size = 'sm',
  dot = false,
  className = '',
}) {
  const key = variant || status;
  const config = variantConfig[key] || { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  const displayLabel = label || formatLabel(String(status || variant || ''));

  return (
    <span className={[
      'inline-flex items-center gap-1.5 font-medium rounded-sm',
      config.bg, config.text,
      sizeClasses[size] || sizeClasses.sm,
      className,
    ].join(' ')}>
      {dot && config.dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      )}
      {displayLabel}
    </span>
  );
}
