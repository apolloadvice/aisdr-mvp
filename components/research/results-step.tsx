'use client';

import { useState } from 'react';
import { ChevronDown, Pencil, Search, Building2, Users, Zap, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CompanyRow, GRID_COLS } from './company-card';
import type { CompanyResult, ComposeEmailParams, ICPCriteria } from '@/lib/types';

function ICPSummary({ icp, onEditCriteria }: { icp: ICPCriteria; onEditCriteria?: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border-border mb-6 rounded-lg border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground truncate text-sm">{icp.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {onEditCriteria && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onEditCriteria();
              }}
              className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs transition-colors"
            >
              <Pencil className="size-3" />
              Edit
            </span>
          )}
          <ChevronDown
            className={`text-muted-foreground size-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${expanded ? 'max-h-40' : 'max-h-0'}`}
      >
        <div className="border-border border-t px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {icp.industry_keywords.map((kw, i) => (
              <span
                key={`ind-${i}`}
                className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs"
              >
                {kw}
              </span>
            ))}
            {icp.tech_keywords.map((kw, i) => (
              <span
                key={`tech-${i}`}
                className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs"
              >
                {kw}
              </span>
            ))}
            {icp.hiring_signals.map((kw, i) => (
              <span
                key={`hire-${i}`}
                className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400"
              >
                {kw}
              </span>
            ))}
            {icp.min_funding_amount && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                ${(icp.min_funding_amount / 1_000_000).toFixed(0)}M+ raised
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const LOADING_STAGES = [
  { icon: Search, label: 'Scanning signals across the web...' },
  { icon: Building2, label: 'Identifying matching companies...' },
  { icon: Users, label: 'Finding decision makers...' },
  { icon: Zap, label: 'Analyzing buying signals...' },
  { icon: Mail, label: 'Crafting personalized hooks...' }
];

function LoadingStatus({ statusMessage }: { statusMessage: string }) {
  const stage = LOADING_STAGES.find((s) =>
    statusMessage.toLowerCase().includes(s.label.split(' ')[0].toLowerCase())
  );
  const CurrentIcon = stage?.icon ?? Search;

  return (
    <div className="bg-card border-border mb-6 overflow-hidden rounded-lg border">
      <div className="relative px-4 py-4">
        {/* Shimmer bar */}
        <div className="bg-muted absolute inset-x-0 bottom-0 h-0.5">
          <div className="bg-primary h-full w-1/3 animate-[shimmer_2s_ease-in-out_infinite] rounded-full" />
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
            <CurrentIcon className="text-primary size-4 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{statusMessage || 'Starting research...'}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">This usually takes 30–60 seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      className={`grid ${GRID_COLS} border-border border-b last:border-b-0`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {[0, 1, 2, 3].map((col) => (
        <div
          key={col}
          className={`min-w-0 space-y-2.5 p-4 ${col < 3 ? 'border-border border-r' : ''}`}
        >
          <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
          <div className="space-y-1.5">
            <div className="bg-muted h-3 w-full animate-pulse rounded" />
            <div className="bg-muted h-3 w-5/6 animate-pulse rounded" />
          </div>
          {col === 3 && <div className="bg-muted mt-3 h-16 w-full animate-pulse rounded-lg" />}
        </div>
      ))}
    </div>
  );
}

export function ResultsStep({
  icp,
  results,
  isLoading,
  statusMessage,
  error,
  onComposeEmail,
  onEditCriteria
}: {
  icp: ICPCriteria | null;
  results: CompanyResult[];
  isLoading: boolean;
  statusMessage: string;
  error: string | null;
  onComposeEmail?: (params: ComposeEmailParams) => void;
  onEditCriteria?: () => void;
}) {
  const showSkeletons = isLoading && results.length === 0;

  return (
    <>
      {icp && <ICPSummary icp={icp} onEditCriteria={onEditCriteria} />}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 mb-6">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading && <LoadingStatus statusMessage={statusMessage} />}

      {(results.length > 0 || showSkeletons) && (
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-sm font-medium">
              {showSkeletons
                ? 'Searching for companies...'
                : isLoading
                  ? `${results.length} companies found so far...`
                  : `${results.length} companies found`}
            </h3>
          </div>

          <div className="border-border bg-card overflow-x-auto rounded-xl border">
            <div className={`bg-muted/50 border-border grid ${GRID_COLS} border-b`}>
              {['Company', 'Target Person', 'Buying Signal', 'Overview & Fit'].map(
                (label, i, arr) => (
                  <div
                    key={label}
                    className={`text-muted-foreground min-w-0 px-4 py-2.5 text-xs font-medium tracking-wider uppercase ${i < arr.length - 1 ? 'border-border border-r' : ''}`}
                  >
                    {label}
                  </div>
                )
              )}
            </div>

            {showSkeletons
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} index={i} />)
              : results.map((result, i) => (
                  <CompanyRow
                    key={`${result.company_name}-${i}`}
                    result={result}
                    index={i}
                    onComposeEmail={onComposeEmail}
                  />
                ))}
          </div>
        </div>
      )}

      {!isLoading && !error && results.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground text-sm">
            No matching companies found. Try editing your ICP criteria.
          </p>
        </div>
      )}
    </>
  );
}
