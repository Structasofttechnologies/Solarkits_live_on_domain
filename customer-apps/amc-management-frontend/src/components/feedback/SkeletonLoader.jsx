// src/components/feedback/SkeletonLoader.jsx

export function SkeletonBox({ className = '' }) {
  return (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-gray-200 rounded animate-pulse"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-lg border border-border p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <SkeletonBox className="h-4 w-32" />
        <SkeletonBox className="h-8 w-8 rounded" />
      </div>
      <SkeletonBox className="h-8 w-24 mb-2" />
      <SkeletonBox className="h-3 w-20" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="bg-gray-50 px-4 py-3 border-b border-border flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="px-4 py-3.5 border-b border-border last:border-0 flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, col) => (
            <SkeletonBox
              key={col}
              className="h-3 flex-1"
              style={{ opacity: col === 0 ? 1 : 0.6 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonKPIGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default function SkeletonLoader({ type = 'page' }) {
  if (type === 'table') return <SkeletonTable />;
  if (type === 'cards') return <SkeletonKPIGrid />;
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-7 w-48" />
        <SkeletonBox className="h-9 w-32 rounded" />
      </div>
      <SkeletonKPIGrid count={4} />
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-lg border border-border p-5">
          <SkeletonBox className="h-4 w-32 mb-4" />
          <SkeletonBox className="h-48 w-full" />
        </div>
        <div className="bg-white rounded-lg border border-border p-5">
          <SkeletonBox className="h-4 w-24 mb-4" />
          <SkeletonBox className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
