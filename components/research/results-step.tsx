'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, Pencil, LayoutGrid, Users, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CompanyRow, GRID_COLS } from './company-card';
import { ContactScreen } from './contact-screen.client';
import { LoadingStatus } from './loading-status';
import { useResearchStore } from '@/lib/store/research-store';
import type { ICPCriteria, CompanyResult, DiscoveredCompanyPreview } from '@/lib/types';

interface ActiveContactCompany {
  name: string;
  apolloOrgId: string;
  result: CompanyResult | null;
}

const SIGNAL_TYPES = ['job_posting', 'funding', 'news', 'product_launch'] as const;
const SIGNAL_LABELS: Record<string, string> = {
  job_posting: 'Job Posting',
  funding: 'Funding',
  news: 'News',
  product_launch: 'Product Launch'
};

type SortOption = 'signals' | 'funding' | 'name' | 'contacted';

function FilterSortBar({
  activeFilters,
  onToggleFilter,
  sort,
  onSortChange
}: {
  activeFilters: Set<string>;
  onToggleFilter: (type: string) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1.5">
        {SIGNAL_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onToggleFilter(type)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              activeFilters.has(type)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {SIGNAL_LABELS[type]}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <Label className="text-muted-foreground text-xs">Sort</Label>
        <Select value={sort} onValueChange={(v: SortOption) => onSortChange(v)}>
          <SelectTrigger className="h-7 w-auto gap-1.5 border-none px-2.5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="signals">Signal Count</SelectItem>
            <SelectItem value="funding">Funding Stage</SelectItem>
            <SelectItem value="name">Company Name (A-Z)</SelectItem>
            <SelectItem value="contacted">Contacted First</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

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
                className="bg-primary/10 text-primary"
                style={{
                  borderRadius: 'var(--tag-radius, 9999px)',
                  paddingInline: 'var(--tag-padding-x, 0.5rem)',
                  paddingBlock: 'var(--tag-padding-y, 0.125rem)',
                  fontSize: 'var(--tag-font-size, 0.75rem)'
                }}
              >
                {kw}
              </span>
            ))}
            {icp.tech_keywords.map((kw, i) => (
              <span
                key={`tech-${i}`}
                className="bg-secondary text-secondary-foreground"
                style={{
                  borderRadius: 'var(--tag-radius, 9999px)',
                  paddingInline: 'var(--tag-padding-x, 0.5rem)',
                  paddingBlock: 'var(--tag-padding-y, 0.125rem)',
                  fontSize: 'var(--tag-font-size, 0.75rem)'
                }}
              >
                {kw}
              </span>
            ))}
            {icp.hiring_signals.map((kw, i) => (
              <span
                key={`hire-${i}`}
                className="bg-accent-secondary/10 text-accent-secondary"
                style={{
                  borderRadius: 'var(--tag-radius, 9999px)',
                  paddingInline: 'var(--tag-padding-x, 0.5rem)',
                  paddingBlock: 'var(--tag-padding-y, 0.125rem)',
                  fontSize: 'var(--tag-font-size, 0.75rem)'
                }}
              >
                {kw}
              </span>
            ))}
            {icp.min_funding_amount && (
              <span
                className="bg-accent-tertiary/10 text-accent-tertiary"
                style={{
                  borderRadius: 'var(--tag-radius, 9999px)',
                  paddingInline: 'var(--tag-padding-x, 0.5rem)',
                  paddingBlock: 'var(--tag-padding-y, 0.125rem)',
                  fontSize: 'var(--tag-font-size, 0.75rem)'
                }}
              >
                ${(icp.min_funding_amount / 1_000_000).toFixed(0)}M+ raised
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const FUNDING_ORDER: Record<string, number> = {
  'Series D+': 0,
  'Series C': 1,
  'Series B': 2,
  'Series A': 3,
  Seed: 4,
  'Pre-Seed': 5
};

function sortCompanies(
  companies: DiscoveredCompanyPreview[],
  resultMap: Map<string, CompanyResult>,
  sort: SortOption,
  contactedEmails: (name: string) => string[]
): DiscoveredCompanyPreview[] {
  const sorted = [...companies];
  sorted.sort((a, b) => {
    const ra = resultMap.get(a.name);
    const rb = resultMap.get(b.name);
    switch (sort) {
      case 'signals':
        return (rb?.signals.length ?? 0) - (ra?.signals.length ?? 0);
      case 'funding': {
        const fa = FUNDING_ORDER[ra?.funding_stage ?? ''] ?? 99;
        const fb = FUNDING_ORDER[rb?.funding_stage ?? ''] ?? 99;
        return fa - fb;
      }
      case 'name':
        return a.name.localeCompare(b.name);
      case 'contacted': {
        const ca = contactedEmails(a.name).length > 0 ? 0 : 1;
        const cb = contactedEmails(b.name).length > 0 ? 0 : 1;
        return ca - cb;
      }
      default:
        return 0;
    }
  });
  return sorted;
}

export function ResultsStep() {
  const icp = useResearchStore((s) => s.icp);
  const results = useResearchStore((s) => s.results);
  const researchingCompany = useResearchStore((s) => s.researchingCompany);
  const isResearching = useResearchStore((s) => s.isResearching);
  const statusMessage = useResearchStore((s) => s.statusMessage);
  const error = useResearchStore((s) => s.error);
  const setStep = useResearchStore((s) => s.setStep);
  const candidates = useResearchStore((s) => s.candidates);
  const selectedCompanies = useResearchStore((s) => s.selectedCompanies);
  const peopleResults = useResearchStore((s) => s.peopleResults);
  const isPeopleSearching = useResearchStore((s) => s.isPeopleSearching);
  const enrichingPersonIds = useResearchStore((s) => s.enrichingPersonIds);
  const enrichPersonAction = useResearchStore((s) => s.enrichPersonAction);
  const getContactedEmails = useResearchStore((s) => s.getContactedEmails);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(SIGNAL_TYPES));
  const [sort, setSort] = useState<SortOption>('signals');
  const [openTabs, setOpenTabs] = useState<ActiveContactCompany[]>([]);
  const [activeTab, setActiveTab] = useState<string>('research');

  const openCompanyTab = useCallback((info: ActiveContactCompany) => {
    setOpenTabs((prev) => {
      if (prev.some((t) => t.name === info.name)) return prev;
      return [...prev, info];
    });
    setActiveTab(info.name);
  }, []);

  const closeCompanyTab = useCallback(
    (name: string) => {
      setOpenTabs((prev) => prev.filter((t) => t.name !== name));
      if (activeTab === name) setActiveTab('research');
    },
    [activeTab]
  );

  const resultMap = useMemo(() => {
    const map = new Map<string, CompanyResult>();
    for (const r of results) {
      map.set(r.company_name, r);
    }
    return map;
  }, [results]);

  const allCompanies = useMemo(() => {
    const seen = new Set<string>();
    const display: DiscoveredCompanyPreview[] = [];
    const candidateMap = new Map(candidates.map((c) => [c.name, c]));
    const selectedSet = new Set(selectedCompanies);

    for (const r of results) {
      seen.add(r.company_name);
      const candidate = candidateMap.get(r.company_name);
      display.push(
        candidate ?? {
          name: r.company_name,
          website: r.website ?? undefined,
          linkedin_url: r.linkedin_url,
          logo_url: r.logo_url
        }
      );
    }

    for (const c of candidates) {
      if (selectedSet.has(c.name) && !seen.has(c.name)) {
        seen.add(c.name);
        display.push(c);
      }
    }

    return display;
  }, [candidates, selectedCompanies, results]);

  const displayCompanies = useMemo(() => {
    const allActive = activeFilters.size === SIGNAL_TYPES.length;

    // If all active, show everything; if none, show nothing
    const filtered = allActive
      ? allCompanies
      : allCompanies.filter((c) => {
          const result = resultMap.get(c.name);
          if (!result) return true; // show pending companies always
          return result.signals.some((s) => activeFilters.has(s.type));
        });

    return sortCompanies(filtered, resultMap, sort, getContactedEmails);
  }, [allCompanies, activeFilters, sort, resultMap, getContactedEmails]);

  const toggleFilter = (type: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const completedCount = results.length;
  const totalCount = allCompanies.length;

  return (
    <>
      {icp && <ICPSummary icp={icp} onEditCriteria={() => setStep('review')} />}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="research">
            <LayoutGrid className="size-3" />
            Research
          </TabsTrigger>
          {openTabs.map((tab) => (
            <TabsTrigger key={tab.name} value={tab.name} className="gap-1 pr-1.5">
              <Users className="size-3" />
              {tab.name}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  closeCompanyTab(tab.name);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    e.preventDefault();
                    closeCompanyTab(tab.name);
                  }
                }}
                className={`ml-0.5 rounded p-0.5 transition-colors ${
                  activeTab === tab.name
                    ? 'hover:bg-primary-foreground/20'
                    : 'hover:bg-muted-foreground/20'
                }`}
              >
                <X className="size-3" />
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Research tab — forceMount + hidden to preserve scroll/filter state */}
        <TabsContent value="research" forceMount className="data-[state=inactive]:hidden">
          {error && (
            <Card className="border-destructive/30 bg-destructive/5 mb-6">
              <CardContent className="pt-6">
                <p className="text-destructive text-sm">{error}</p>
              </CardContent>
            </Card>
          )}

          {isResearching && (
            <LoadingStatus
              statusMessage={statusMessage}
              subtitle="This usually takes 30–60 seconds"
            />
          )}

          {allCompanies.length > 0 && (
            <div>
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="text-sm font-medium">
                  {isResearching
                    ? `Researching companies (${completedCount}/${totalCount})...`
                    : `${completedCount} companies researched`}
                </h3>
              </div>

              {!isResearching && results.length > 0 && (
                <FilterSortBar
                  activeFilters={activeFilters}
                  onToggleFilter={toggleFilter}
                  sort={sort}
                  onSortChange={setSort}
                />
              )}

              <div className="border-border bg-card overflow-x-auto rounded-(--card-radius) border lg:overflow-x-auto">
                <div className={`bg-muted/50 border-border hidden ${GRID_COLS} border-b lg:grid`}>
                  {['Company', 'Target Person', 'Buying Signal', 'Overview & Fit'].map(
                    (label, i, arr) => (
                      <div
                        key={label}
                        className={`text-muted-foreground section-label min-w-0 px-4 py-2.5 ${i < arr.length - 1 ? 'border-border border-r' : ''}`}
                      >
                        {label}
                      </div>
                    )
                  )}
                </div>

                {displayCompanies.map((candidate) => {
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
                      onViewContacts={openCompanyTab}
                      people={peopleResults[candidate.name]}
                      isPeopleSearching={isPeopleSearching}
                      onEnrichPerson={enrichPersonAction}
                      enrichingPersonIds={enrichingPersonIds}
                      contactedEmails={getContactedEmails(candidate.name)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {!isResearching && !error && allCompanies.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-sm">
                No matching companies found. Try editing your ICP criteria.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Company contact tabs — each forceMount to preserve state */}
        {openTabs.map((tab) => {
          const companyIndex = displayCompanies.findIndex((c) => c.name === tab.name);
          const nextCompany =
            companyIndex >= 0 && companyIndex < displayCompanies.length - 1
              ? displayCompanies[companyIndex + 1]
              : null;
          const nextResult = nextCompany ? (resultMap.get(nextCompany.name) ?? null) : null;

          return (
            <TabsContent
              key={tab.name}
              value={tab.name}
              forceMount
              className="data-[state=inactive]:hidden"
            >
              <ContactScreen
                companyName={tab.name}
                apolloOrgId={tab.apolloOrgId}
                result={tab.result}
                onNextCompany={
                  nextCompany
                    ? () =>
                        openCompanyTab({
                          name: nextCompany.name,
                          apolloOrgId: nextCompany.apollo_org_id ?? '',
                          result: nextResult
                        })
                    : undefined
                }
                nextCompanyName={nextCompany?.name}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </>
  );
}
