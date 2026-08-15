/**
 * IndustryContentSkeleton.jsx
 *
 * Skeleton loaders for the full industry dashboard content area.
 */

export function HeroBannerSkeleton() {
  return (
    <div className="w-full rounded-3xl min-h-[280px] bg-slate-200 animate-pulse" />
  );
}

export function SliderSkeleton() {
  return (
    <div className="w-full rounded-2xl min-h-[240px] bg-slate-200 animate-pulse" />
  );
}

export function VideoGridSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
          <div className="aspect-video bg-slate-200" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ContentSectionSkeleton() {
  return (
    <div className="space-y-8">
      <HeroBannerSkeleton />
      <SliderSkeleton />
      <VideoGridSkeleton />
    </div>
  );
}

export default ContentSectionSkeleton;
