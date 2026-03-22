import { MAX_WIDTH } from '@/lib/layout';

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-md ${className ?? ''}`} />;
}

export default function Loading() {
  return (
    <div className={`mx-auto ${MAX_WIDTH} px-4 py-10 md:px-6`}>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Email list */}
      <div className="bg-card border-border overflow-hidden rounded-lg border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-border flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
            <Skeleton className="size-3.5 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-3 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
