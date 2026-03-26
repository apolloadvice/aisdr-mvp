'use client';

import type { Signal } from '@/lib/types';

const SIGNAL_META: Record<string, { label: string; color: string }> = {
  job_posting: { label: 'Job Postings', color: 'bg-accent-secondary' },
  funding: { label: 'Funding', color: 'bg-primary' },
  news: { label: 'News', color: 'bg-accent-tertiary' },
  product_launch: { label: 'Product Launches', color: 'bg-accent-secondary' }
};

export function SignalBreakdown({ signals }: { signals: Signal[] }) {
  const max = signals.length > 0 ? signals[0].count : 1;

  return (
    <div className="bg-card rounded-(--card-radius) px-[var(--density-card-px)] py-[var(--density-card-py)] shadow-xs">
      <h3 className="text-foreground text-sm font-medium">Top Buying Signals</h3>
      <p className="section-label text-muted-foreground mt-0.5 mb-5">Across all research</p>
      {signals.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-xs">No signals found yet</p>
      ) : (
        <div className="space-y-3">
          {signals.map((s) => {
            const meta = SIGNAL_META[s.type];
            return (
              <div key={s.type} className="flex items-center gap-3">
                <span
                  className={`size-2 shrink-0 rounded-full ${meta?.color ?? 'bg-muted-foreground'}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-foreground text-xs font-medium">
                      {meta?.label ?? s.type}
                    </span>
                    <span className="text-muted-foreground text-xs tabular-nums">{s.count}</span>
                  </div>
                  <div className="bg-muted h-1 overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full ${meta?.color ?? 'bg-muted-foreground'}`}
                      style={{ width: `${(s.count / max) * 100}%`, opacity: 0.6 }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
