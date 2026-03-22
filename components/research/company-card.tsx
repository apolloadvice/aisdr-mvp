'use client';

import { useState } from 'react';
import {
  Building2,
  DollarSign,
  ExternalLink,
  Linkedin,
  Users,
  Mail,
  AtSign,
  Loader2,
  RotateCw
} from 'lucide-react';
import { SignalBadge } from './signal-badge';
import { CopyButton } from './copy-button.client';
import { EmailEditorDialog } from './email-editor-dialog.client';
import { Button } from '@/components/ui/button';
import { CompanyLogoWithFallback } from '@/components/company-logo';
import { useResearchStore } from '@/lib/store/research-store';
import type {
  CompanyResult,
  ComposeEmailParams,
  ICPCriteria,
  TargetContact,
  SourceLink,
  DiscoveredCompanyPreview,
  ApolloPersonPreview
} from '@/lib/types';

interface ViewContactsInfo {
  name: string;
  apolloOrgId: string;
  result: CompanyResult | null;
}

export const GRID_COLS = 'lg:min-w-[900px] grid-cols-[1fr_1fr_1.5fr_1.5fr]';

type RowStatus = 'pending' | 'researching' | 'complete' | 'error';

function SourceLinkRow({ source }: { source: SourceLink }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-primary group flex items-center gap-1 truncate text-xs transition-colors"
    >
      <ExternalLink className="size-3 shrink-0 opacity-50 group-hover:opacity-100" />
      <span className="truncate">{source.title || source.url}</span>
    </a>
  );
}

function ShimmerBlock({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className ?? ''}`} />;
}

function PendingColumn({ isResearching }: { isResearching: boolean }) {
  return (
    <div className="min-w-0 space-y-2.5 p-4">
      {isResearching ? (
        <>
          <div className="flex items-center gap-2">
            <Loader2 className="text-muted-foreground size-3 animate-spin" />
            <span className="text-muted-foreground text-xs">Researching...</span>
          </div>
          <ShimmerBlock className="h-3 w-full" />
          <ShimmerBlock className="h-3 w-5/6" />
          <ShimmerBlock className="h-3 w-2/3" />
        </>
      ) : (
        <>
          <ShimmerBlock className="h-3 w-3/4" />
          <ShimmerBlock className="h-3 w-full" />
          <ShimmerBlock className="h-3 w-5/6" />
        </>
      )}
    </div>
  );
}

function MobileCompanyCard({
  preview,
  result,
  status,
  isComplete,
  isResearching,
  hasContacted,
  people,
  isPeopleSearching,
  onViewContacts,
  onReResearch
}: {
  preview: DiscoveredCompanyPreview;
  result: CompanyResult | null;
  status: RowStatus;
  isComplete: boolean;
  isResearching: boolean;
  hasContacted: boolean;
  people?: ApolloPersonPreview[];
  isPeopleSearching?: boolean;
  onViewContacts?: () => void;
  onReResearch?: () => void;
}) {
  const hasPeople = people && people.length > 0;

  return (
    <div className="bg-card border-border space-y-3 border-b p-4 last:border-b-0 lg:hidden">
      {/* Company header */}
      <div className="flex items-center gap-2">
        <CompanyLogoWithFallback
          name={preview.name}
          website={preview.website}
          logoUrl={preview.logo_url ?? result?.logo_url}
        />
        <a
          href={preview.linkedin_url ?? result?.linkedin_url ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary text-sm font-semibold transition-colors"
        >
          {preview.name}
        </a>
        {(preview.linkedin_url || result?.linkedin_url) && (
          <a
            href={preview.linkedin_url ?? result?.linkedin_url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Linkedin className="size-3" />
          </a>
        )}
        {hasContacted && (
          <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-medium">
            Contacted
          </span>
        )}
      </div>

      {/* Industry + funding */}
      {isComplete && result && (
        <div className="text-muted-foreground space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5">
            <Building2 className="size-3 shrink-0" />
            <span>{result.industry}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="size-3 shrink-0" />
            <span>
              {result.amount_raised} &middot; {result.funding_stage}
            </span>
          </div>
        </div>
      )}

      {/* Signals */}
      {isComplete && result && result.signals.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.signals.slice(0, 3).map((signal, i) => (
            <SignalBadge key={i} type={signal.type} />
          ))}
        </div>
      )}

      {/* Contact */}
      {isPeopleSearching || isResearching ? (
        <div className="flex items-center gap-2">
          <Loader2 className="text-muted-foreground size-3 animate-spin" />
          <span className="text-muted-foreground text-xs">Researching...</span>
        </div>
      ) : (isComplete || hasPeople) && preview.apollo_org_id ? (
        <div className="space-y-2">
          {hasPeople &&
            (people ?? []).slice(0, 3).map((person) => (
              <div key={person.apollo_person_id} className="flex items-center gap-1.5">
                {person.has_email && <Mail className="text-primary size-3 shrink-0" />}
                <span className="truncate text-sm font-medium">
                  {person.is_enriched
                    ? `${person.first_name} ${person.last_name}`
                    : `${person.first_name} ${person.last_name_obfuscated}`}
                </span>
              </div>
            ))}
          <Button size="xs" onClick={() => onViewContacts?.()} className="w-full">
            <Users className="size-3" />
            View Contacts
          </Button>
        </div>
      ) : null}

      {/* Overview */}
      {isComplete && result && (
        <p className="text-muted-foreground text-xs leading-relaxed">
          {result.company_overview.slice(0, 200)}
          {result.company_overview.length > 200 ? '...' : ''}
        </p>
      )}

      {(status === 'error' || status === 'pending') && onReResearch && (
        <div className="flex items-center gap-2">
          {status === 'error' && <span className="text-destructive text-xs">Research failed</span>}
          <Button variant="outline" size="xs" onClick={onReResearch}>
            <RotateCw className="size-3" />
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

/** Renders a single company row — handles both preview (loading) and complete states */
export function CompanyRow({
  preview,
  result,
  status,
  onViewContacts,
  onReResearch,
  people,
  isPeopleSearching,
  onEnrichPerson,
  enrichingPersonIds,
  contactedEmails
}: {
  preview: DiscoveredCompanyPreview;
  result: CompanyResult | null;
  status: RowStatus;
  onViewContacts?: (info: ViewContactsInfo) => void;
  onReResearch?: (companyName: string) => void;
  people?: ApolloPersonPreview[];
  isPeopleSearching?: boolean;
  onEnrichPerson?: (personId: string, companyName: string) => void;
  enrichingPersonIds?: string[];
  contactedEmails?: string[];
}) {
  const [composeParams, setComposeParams] = useState<ComposeEmailParams | null>(null);
  const icp = useResearchStore((s) => s.icp);
  const isComplete = status === 'complete' && result !== null;
  const isResearching = status === 'researching';
  const hasContacted = contactedEmails && contactedEmails.length > 0;
  const showRetry = !isComplete && !isResearching && onReResearch;

  const handleViewContacts = () => {
    if (!preview.apollo_org_id) return;
    onViewContacts?.({
      name: preview.name,
      apolloOrgId: preview.apollo_org_id,
      result
    });
  };

  const handleCompose = (person: ApolloPersonPreview) => {
    if (!result || !person.is_enriched || !person.email) return;
    const fallbackIcp: ICPCriteria = icp ?? {
      description: '',
      industry_keywords: [],
      min_employees: null,
      max_employees: null,
      min_funding_amount: null,
      funding_stages: [],
      hiring_signals: [],
      tech_keywords: [],
      company_examples: [],
      locations: []
    };
    const contact: TargetContact = {
      name: `${person.first_name} ${person.last_name}`,
      title: person.title ?? '',
      email: person.email,
      linkedin_url: person.linkedin_url ?? '',
      is_decision_maker: false
    };
    setComposeParams({ company: result, contact, icp: fallbackIcp });
  };

  const hasPeople = people && people.length > 0;

  const allSources = result
    ? [...result.sources.funding, ...result.sources.news, ...result.sources.jobs]
    : [];

  return (
    <>
      {/* Mobile card */}
      <MobileCompanyCard
        preview={preview}
        result={result}
        status={status}
        isComplete={isComplete}
        isResearching={isResearching}
        hasContacted={!!hasContacted}
        people={people}
        isPeopleSearching={isPeopleSearching}
        onViewContacts={handleViewContacts}
        onReResearch={onReResearch ? () => onReResearch(preview.name) : undefined}
      />
      {/* Desktop grid row */}
      <div className={`bg-card border-border hidden ${GRID_COLS} border-b last:border-b-0 lg:grid`}>
        <div className="border-border min-w-0 space-y-3 border-r p-4">
          <div>
            <div className="flex items-center gap-2">
              <CompanyLogoWithFallback
                name={preview.name}
                website={preview.website}
                logoUrl={preview.logo_url ?? result?.logo_url}
              />
              <a
                href={preview.linkedin_url ?? result?.linkedin_url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary text-sm font-semibold transition-colors"
                title="View on LinkedIn"
              >
                {preview.name}
              </a>
              {(preview.linkedin_url || result?.linkedin_url) && (
                <a
                  href={preview.linkedin_url ?? result?.linkedin_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="LinkedIn"
                >
                  <Linkedin className="size-3 shrink-0" />
                </a>
              )}
              {(preview.website || result?.website) && (
                <a
                  href={preview.website ?? result?.website ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Website"
                >
                  <ExternalLink className="size-3" />
                </a>
              )}
              {hasContacted && (
                <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                  Contacted
                </span>
              )}
            </div>

            {isComplete && result ? (
              <div className="text-muted-foreground mt-1.5 space-y-0.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <Building2 className="size-3 shrink-0" />
                  <span>{result.industry}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="size-3 shrink-0" />
                  {result.sources.funding.length > 0 ? (
                    <a
                      href={result.sources.funding[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {result.amount_raised} &middot; {result.funding_stage}
                    </a>
                  ) : (
                    <span>
                      {result.amount_raised} &middot; {result.funding_stage}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-1.5 space-y-1">
                {preview.description && (
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {preview.description}
                  </p>
                )}
                {!isComplete && !showRetry && (
                  <div className="space-y-1">
                    <ShimmerBlock className="h-3 w-2/3" />
                    <ShimmerBlock className="h-3 w-1/2" />
                  </div>
                )}
              </div>
            )}
          </div>

          {allSources.length > 0 && (
            <div className="space-y-1">
              {allSources.slice(0, 3).map((s, i) => (
                <SourceLinkRow key={i} source={s} />
              ))}
            </div>
          )}

          {showRetry && (
            <div className="flex items-center gap-2 pt-1">
              {status === 'error' && (
                <span className="text-destructive text-xs">Research failed</span>
              )}
              <Button size="xs" onClick={() => onReResearch(preview.name)}>
                <RotateCw className="size-3" />
                Retry Research
              </Button>
            </div>
          )}
        </div>

        <div className="border-border min-w-0 border-r">
          {showRetry ? (
            <div className="p-4" />
          ) : isPeopleSearching ? (
            <PendingColumn isResearching={true} />
          ) : !preview.apollo_org_id && !hasPeople ? (
            <div className="flex items-center p-4">
              <p className="text-muted-foreground text-xs">No contacts available</p>
            </div>
          ) : isComplete || hasPeople ? (
            <div className="space-y-3 p-4">
              {hasPeople && (
                <div className="space-y-2">
                  {(people ?? []).slice(0, 3).map((person) => {
                    const displayName = person.is_enriched
                      ? `${person.first_name} ${person.last_name}`
                      : `${person.first_name} ${person.last_name_obfuscated}`;
                    const isEnriching = enrichingPersonIds?.includes(person.apollo_person_id);
                    return (
                      <div key={person.apollo_person_id} className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {person.has_email && <Mail className="text-primary size-3 shrink-0" />}
                          <span className="truncate text-sm font-medium">{displayName}</span>
                          {person.is_enriched && person.linkedin_url && (
                            <a
                              href={person.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Linkedin className="size-3" />
                            </a>
                          )}
                          {person.is_enriched &&
                            person.email &&
                            contactedEmails?.includes(person.email) && (
                              <span className="text-muted-foreground bg-muted rounded px-1 py-0.5 text-[10px] font-medium">
                                Sent
                              </span>
                            )}
                          {!person.is_enriched && (
                            <Button
                              variant="outline"
                              size="icon-xs"
                              className="ml-auto shrink-0"
                              disabled={isEnriching}
                              label={isEnriching ? 'Loading...' : 'Get Contact'}
                              onClick={() =>
                                onEnrichPerson?.(person.apollo_person_id, preview.name)
                              }
                            >
                              {isEnriching ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Users className="size-3" />
                              )}
                            </Button>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">{person.title}</p>
                        {person.is_enriched && person.email && (
                          <div className="flex items-center gap-1">
                            <AtSign className="text-muted-foreground size-3 shrink-0" />
                            <button
                              type="button"
                              onClick={() => handleCompose(person)}
                              className="text-muted-foreground hover:text-primary min-w-0 truncate text-xs transition-colors"
                            >
                              {person.email}
                            </button>
                            <CopyButton text={person.email} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {preview.apollo_org_id && (
                <Button size="xs" onClick={handleViewContacts} className="w-full">
                  <Users className="size-3" />
                  View Contacts
                </Button>
              )}
            </div>
          ) : (
            <PendingColumn isResearching={isResearching} />
          )}
        </div>

        <div className="border-border min-w-0 border-r">
          {showRetry ? (
            <div className="p-4" />
          ) : isComplete && result ? (
            <div className="space-y-3 p-4">
              <div className="space-y-2">
                {result.signals.slice(0, 3).map((signal, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <SignalBadge type={signal.type} />
                      {signal.source_url ? (
                        <a
                          href={signal.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary group flex items-center gap-1 text-xs font-medium transition-colors"
                        >
                          <span className="line-clamp-1">{signal.title}</span>
                          <ExternalLink className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                        </a>
                      ) : (
                        <span className="line-clamp-1 text-xs font-medium">{signal.title}</span>
                      )}
                    </div>
                    {signal.key_phrases.length > 0 && (
                      <div className="flex gap-1 overflow-hidden">
                        {signal.key_phrases.slice(0, 3).map((phrase, j) => (
                          <span
                            key={j}
                            className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-xs"
                          >
                            {phrase}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">{result.match_reason}</p>
            </div>
          ) : (
            <PendingColumn isResearching={isResearching} />
          )}
        </div>

        <div className="min-w-0">
          {isComplete && result ? (
            <div className="space-y-3 p-4">
              <p className="text-xs leading-relaxed">{result.company_overview}</p>
            </div>
          ) : showRetry ? (
            <div className="p-4" />
          ) : (
            <PendingColumn isResearching={isResearching} />
          )}
        </div>
      </div>

      <EmailEditorDialog
        open={composeParams !== null}
        params={composeParams}
        onClose={() => setComposeParams(null)}
      />
    </>
  );
}
