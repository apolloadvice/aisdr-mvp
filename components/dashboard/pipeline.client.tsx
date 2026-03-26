'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import type { Funnel } from '@/lib/types';

const FUNNEL_COLORS = [
  'border-primary',
  'border-accent-tertiary',
  'border-accent-secondary',
  'border-primary'
] as const;

export function Pipeline({ funnel }: { funnel: Funnel }) {
  const steps = [
    { label: 'Sessions', value: funnel.sessions, href: '/research' },
    { label: 'Researched', value: funnel.companies_researched },
    { label: 'Contacted', value: funnel.companies_contacted },
    { label: 'Emails Sent', value: funnel.emails_sent, href: '/emails' }
  ];

  return (
    <div className="bg-card rounded-(--card-radius) px-[var(--density-card-px)] py-[var(--density-card-py)] shadow-xs">
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:flex md:items-center md:justify-between md:gap-0">
        {steps.map((step, i) => {
          const content = (
            <div className={`border-l-2 pl-3 ${FUNNEL_COLORS[i]}`}>
              <p className="text-foreground text-xl leading-tight font-semibold">{step.value}</p>
              <p className="section-label text-muted-foreground">{step.label}</p>
            </div>
          );

          return (
            <div key={step.label} className="flex items-center gap-4 md:gap-5">
              {step.href ? (
                <Link href={step.href} className="group flex items-center gap-2">
                  {content}
                  <ArrowRight className="text-muted-foreground size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ) : (
                content
              )}
              {i < steps.length - 1 && (
                <ChevronRight className="text-border hidden size-4 shrink-0 md:block" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
