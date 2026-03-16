'use client';

import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanyRow } from './company-card';
import type { CompanyResult, ICPCriteria } from '@/lib/types';

export function ResultsStep({
  icp,
  results,
  isLoading,
  statusMessage,
  error
}: {
  icp: ICPCriteria | null;
  results: CompanyResult[];
  isLoading: boolean;
  statusMessage: string;
  error: string | null;
}) {
  return (
    <>
      {/* Collapsed ICP summary */}
      {icp && (
        <Card className="mb-6" size="sm">
          <CardHeader>
            <CardTitle className="text-sm">Research Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm">{icp.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {icp.industry_keywords.map((kw, i) => (
                <span
                  key={i}
                  className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs"
                >
                  {kw}
                </span>
              ))}
              {icp.tech_keywords.map((kw, i) => (
                <span
                  key={i}
                  className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs"
                >
                  {kw}
                </span>
              ))}
              {icp.hiring_signals.map((kw, i) => (
                <span
                  key={i}
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
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 mb-6">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="mb-6 flex items-center gap-3">
          <Loader2 className="text-primary size-4 animate-spin" />
          <p className="text-muted-foreground text-sm">{statusMessage || 'Researching...'}</p>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium">
            {isLoading
              ? `${results.length} companies found so far...`
              : `${results.length} companies found`}
          </h3>

          <div className="border-border bg-card overflow-hidden rounded-xl border">
            <div className="bg-muted/50 border-border grid grid-cols-[1.2fr_1fr_1.4fr_1.4fr] gap-0 border-b">
              <div className="border-border text-muted-foreground border-r px-4 py-2.5 text-xs font-medium tracking-wider uppercase">
                Company
              </div>
              <div className="border-border text-muted-foreground border-r px-4 py-2.5 text-xs font-medium tracking-wider uppercase">
                Target Person
              </div>
              <div className="border-border text-muted-foreground border-r px-4 py-2.5 text-xs font-medium tracking-wider uppercase">
                Buying Signal
              </div>
              <div className="text-muted-foreground px-4 py-2.5 text-xs font-medium tracking-wider uppercase">
                Overview &amp; Fit
              </div>
            </div>

            {results.map((result, i) => (
              <CompanyRow key={`${result.company_name}-${i}`} result={result} index={i} />
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
