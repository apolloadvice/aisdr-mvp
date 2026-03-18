'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CompanyRow, GRID_COLS } from './company-card';
import { LoadingStatus } from './loading-status';
import { useResearchStore } from '@/lib/store/research-store';
import type { ICPCriteria } from '@/lib/types';

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

export function ResultsStep() {
  const icp = useResearchStore((s) => s.icp);
  const results = useResearchStore((s) => s.results);
  const researchingCompany = useResearchStore((s) => s.researchingCompany);
  const isResearching = useResearchStore((s) => s.isResearching);
  const statusMessage = useResearchStore((s) => s.statusMessage);
  const error = useResearchStore((s) => s.error);
  const setComposeParams = useResearchStore((s) => s.setComposeParams);
  const setStep = useResearchStore((s) => s.setStep);
  const selectedCandidates = useResearchStore((s) => s.selectedCandidates)();
  const peopleResults = useResearchStore((s) => s.peopleResults);
  const isPeopleSearching = useResearchStore((s) => s.isPeopleSearching);
  const enrichingPersonIds = useResearchStore((s) => s.enrichingPersonIds);
  const enrichPersonAction = useResearchStore((s) => s.enrichPersonAction);

  const resultMap = useMemo(() => {
    const map = new Map<string, (typeof results)[number]>();
    for (const r of results) {
      map.set(r.company_name, r);
    }
    return map;
  }, [results]);

  const completedCount = results.length;
  const totalCount = selectedCandidates.length;

  return (
    <>
      {icp && <ICPSummary icp={icp} onEditCriteria={() => setStep('review')} />}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 mb-6">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {isResearching && (
        <LoadingStatus statusMessage={statusMessage} subtitle="This usually takes 30–60 seconds" />
      )}

      {selectedCandidates.length > 0 && (
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-sm font-medium">
              {isResearching
                ? `Researching companies (${completedCount}/${totalCount})...`
                : `${completedCount} companies researched`}
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

            {selectedCandidates.map((candidate, i) => {
              const result = resultMap.get(candidate.name) ?? null;
              const isCurrentlyResearching = researchingCompany === candidate.name;

              let status: 'pending' | 'researching' | 'complete' | 'error';
              if (result) {
                status = 'complete';
              } else if (isCurrentlyResearching) {
                status = 'researching';
              } else {
                status = 'pending';
              }

              return (
                <CompanyRow
                  key={candidate.name}
                  preview={candidate}
                  result={result}
                  status={status}
                  index={i}
                  onComposeEmail={setComposeParams}
                  people={peopleResults[candidate.name]}
                  isPeopleSearching={isPeopleSearching}
                  onEnrichPerson={enrichPersonAction}
                  enrichingPersonIds={enrichingPersonIds}
                />
              );
            })}
          </div>
        </div>
      )}

      {!isResearching && !error && selectedCandidates.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground text-sm">
            No matching companies found. Try editing your ICP criteria.
          </p>
        </div>
      )}
    </>
  );
}
