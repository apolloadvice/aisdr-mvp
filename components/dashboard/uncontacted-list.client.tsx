'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CompanyLogoWithFallback } from '@/components/shared/company-logo';
import type { UncontactedCompany } from '@/lib/types';

export function UncontactedList({ companies }: { companies: UncontactedCompany[] }) {
  return (
    <div className="bg-card rounded-(--card-radius) px-[var(--density-card-px)] py-[var(--density-card-py)] shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-foreground text-sm font-medium">Ready to Contact</h3>
            <Link
              href="/research"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              View all
            </Link>
          </div>
          <p className="section-label text-muted-foreground mt-0.5">Researched, no outreach yet</p>
        </div>
        {companies.length > 0 && (
          <span className="bg-accent-secondary/10 text-accent-secondary rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
            {companies.length}
          </span>
        )}
      </div>
      {companies.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-xs">
          All researched companies have been contacted
        </p>
      ) : (
        <div className="-mx-2 space-y-0.5">
          {companies.map((c) => (
            <Link
              key={`${c.session_id}-${c.name}`}
              href={`/research/${c.session_id}`}
              className="hover:bg-muted/50 group flex items-center justify-between rounded-md px-2 py-2 transition-colors"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <CompanyLogoWithFallback
                  name={c.name}
                  website={c.website}
                  logoUrl={c.logo_url}
                  size="sm"
                />
                <span className="text-foreground truncate text-sm">{c.name}</span>
              </div>
              <ArrowRight className="text-muted-foreground size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
