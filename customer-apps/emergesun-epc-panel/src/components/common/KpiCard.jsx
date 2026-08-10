import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KpiCard({ icon: Icon, label, value, change, changePeriod, color = 'primary', onClick, tooltip }) {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const colorMap = {
    primary: 'bg-primary-50 text-primary',
    secondary: 'bg-amber-50 text-amber-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-orange-50 text-orange-600',
    error: 'bg-red-50 text-red-600',
    info: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div
      className={`card card-hover p-5 ${onClick ? 'cursor-pointer' : ''} animate-fade-in`}
      onClick={onClick}
      title={tooltip}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color] || colorMap.primary}`}>
          {Icon && <Icon size={20} />}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full
            ${isNeutral ? 'bg-gray-100 text-gray-500' : isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isNeutral ? <Minus size={11} /> : isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {isNeutral ? '0%' : `${isPositive ? '+' : ''}${change}%`}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-solar-navy mb-1">{value}</div>
      <div className="text-sm text-solar-slate">{label}</div>
      {changePeriod && (
        <div className="text-xs text-gray-400 mt-1">{changePeriod}</div>
      )}
    </div>
  );
}
