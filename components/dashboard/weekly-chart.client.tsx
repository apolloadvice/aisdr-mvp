'use client';

import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { WeeklyEmail } from '@/lib/types';

export function WeeklyChart({ data }: { data: WeeklyEmail[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-card rounded-(--card-radius) px-[var(--density-card-px)] py-[var(--density-card-py)] shadow-xs">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <h3 className="text-foreground text-sm font-medium">Weekly Activity</h3>
          <p className="section-label text-muted-foreground mt-0.5">Emails sent</p>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-foreground text-lg font-semibold">{total}</span>
          <Link
            href="/emails"
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            View all
          </Link>
        </div>
      </div>
      <div className="space-y-2.5">
        {[...data].reverse().map((d, i) => (
          <div key={d.week} className="flex items-center gap-3">
            <span className="section-label text-muted-foreground w-14 shrink-0 text-right">
              {d.week}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted/50 h-5 flex-1 cursor-default overflow-hidden rounded">
                  <div
                    className="bg-primary/70 h-full rounded transition-all duration-500"
                    style={{
                      width: `${d.count > 0 ? Math.max((d.count / max) * 100, 6) : 0}%`,
                      transitionDelay: `${i * 60}ms`
                    }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {d.count} {d.count === 1 ? 'email' : 'emails'} sent
              </TooltipContent>
            </Tooltip>
            <span className="text-foreground w-6 shrink-0 text-right text-xs font-medium tabular-nums">
              {d.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
