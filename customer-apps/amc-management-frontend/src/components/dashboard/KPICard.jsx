// src/components/dashboard/KPICard.jsx
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { formatTrend, getTrendColor } from '../../utils/formatters';

export default function KPICard({
  title,
  value,
  trend,
  trendLabel,
  icon: Icon,
  iconBg = 'bg-solar/10',
  iconColor = 'text-solar',
  onClick,
  suffix = '',
  prefix = '',
  tooltip,
  highlight = false,
}) {
  const isPositive = trend > 0;
  const trendColor = getTrendColor(trend);

  return (
    <div
      onClick={onClick}
      className={[
        'bg-white rounded-lg border shadow-card p-5 transition-all duration-200',
        onClick ? 'cursor-pointer hover:shadow-card-md hover:border-solar/20' : '',
        highlight ? 'border-solar/30 ring-1 ring-solar/20' : 'border-border',
      ].join(' ')}
      role={onClick ? 'button' : 'article'}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          {Icon && <Icon size={20} className={iconColor} />}
        </div>
        {tooltip && (
          <div className="group relative">
            <Info size={14} className="text-text-muted cursor-help" />
            <div className="hidden group-hover:block absolute right-0 top-full mt-1 z-10 w-52 bg-navy text-white text-xs px-3 py-2 rounded-lg shadow-lg">
              {tooltip}
            </div>
          </div>
        )}
      </div>

      <div className="mb-1">
        <span className="text-xs text-text-secondary font-medium">{prefix}</span>
        <p className="text-2xl font-bold text-navy inline">
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </p>
        {suffix && <span className="text-base font-semibold text-text-secondary ml-1">{suffix}</span>}
      </div>

      <p className="text-sm text-text-secondary mb-3">{title}</p>

      {trend !== undefined && (
        <div className="flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp size={13} className="text-success" />
          ) : (
            <TrendingDown size={13} className="text-danger" />
          )}
          <span className={`text-xs font-semibold ${trendColor}`}>
            {formatTrend(trend)}
          </span>
          {trendLabel && (
            <span className="text-xs text-text-muted">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
