// src/components/charts/ChartWidgets.jsx
// Reusable chart wrapper components using Recharts
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ─── Color Palette ─────────────────────────────────────────────
export const CHART_COLORS = {
  primary: '#F9B233',
  secondary: '#0B3A53',
  success: '#22A06B',
  info: '#2878C8',
  warning: '#F59E0B',
  danger: '#DC3545',
  muted: '#9FB3C8',
};

export const CHART_COLOR_ARRAY = [
  '#F9B233', '#2878C8', '#22A06B', '#0B3A53', '#F59E0B', '#DC3545', '#9FB3C8',
];

// ─── Custom Tooltip ────────────────────────────────────────────
function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-dropdown border border-border px-3 py-2.5 text-sm">
      {label && <p className="font-semibold text-navy mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-text-secondary">{entry.name}:</span>
          <span className="font-medium text-navy">
            {formatter ? formatter(entry.value, entry.name) : entry.value.toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Area Chart Widget ─────────────────────────────────────────
export function AreaChartWidget({
  data,
  areas,
  xKey = 'month',
  height = 200,
  formatter,
  gradient = true,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          {areas.map((a, i) => (
            <linearGradient key={a.key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={a.color || CHART_COLOR_ARRAY[i]} stopOpacity={0.15} />
              <stop offset="95%" stopColor={a.color || CHART_COLOR_ARRAY[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8F0F7" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#627D98' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#627D98' }} axisLine={false} tickLine={false} width={50}
          tickFormatter={v => v >= 100000 ? `${(v/100000).toFixed(0)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        {areas.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {areas.map((a, i) => (
          <Area
            key={a.key}
            type="monotone"
            dataKey={a.key}
            name={a.name || a.key}
            stroke={a.color || CHART_COLOR_ARRAY[i]}
            strokeWidth={2}
            fill={gradient ? `url(#grad-${i})` : 'transparent'}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Bar Chart Widget ──────────────────────────────────────────
export function BarChartWidget({
  data,
  bars,
  xKey = 'month',
  height = 200,
  formatter,
  stacked = false,
  horizontal = false,
}) {
  const ChartComp = horizontal ? BarChart : BarChart;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComp
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E8F0F7" vertical={!horizontal} horizontal={horizontal} />
        {horizontal ? (
          <>
            <YAxis dataKey={xKey} type="category" tick={{ fontSize: 11, fill: '#627D98' }} axisLine={false} tickLine={false} width={100} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#627D98' }} axisLine={false} tickLine={false} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#627D98' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#627D98' }} axisLine={false} tickLine={false} width={50}
              tickFormatter={v => v >= 100000 ? `${(v/100000).toFixed(0)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          </>
        )}
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {bars.map((b, i) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.name || b.key}
            fill={b.color || CHART_COLOR_ARRAY[i]}
            stackId={stacked ? 'stack' : undefined}
            radius={stacked ? undefined : [2, 2, 0, 0]}
          />
        ))}
      </ChartComp>
    </ResponsiveContainer>
  );
}

// ─── Pie Chart Widget ──────────────────────────────────────────
export function PieChartWidget({ data, height = 200, showLegend = true, innerRadius = 0 }) {
  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className={showLegend ? 'flex items-center gap-4' : ''}>
      <ResponsiveContainer width={showLegend ? 160 : '100%'} height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius="80%"
            dataKey="value"
            labelLine={false}
            label={renderLabel}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color || CHART_COLOR_ARRAY[i]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {showLegend && (
        <div className="flex-1 space-y-2 min-w-0">
          {data.map((entry, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: entry.color || CHART_COLOR_ARRAY[i] }}
                />
                <span className="text-xs text-text-secondary truncate">{entry.name}</span>
              </div>
              <span className="text-xs font-semibold text-navy shrink-0">
                {entry.value.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Line Chart Widget ────────────────────────────────────────
export function LineChartWidget({ data, lines, xKey = 'month', height = 200, formatter }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8F0F7" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#627D98' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#627D98' }} axisLine={false} tickLine={false} width={50} />
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {lines.map((l, i) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name || l.key}
            stroke={l.color || CHART_COLOR_ARRAY[i]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
