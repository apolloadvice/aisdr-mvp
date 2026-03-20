'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Mail,
  Loader2,
  Linkedin,
  Search,
  Crown,
  PenSquare,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CopyButton } from './copy-button.client';
import { useResearchStore } from '@/lib/store/research-store';
import { searchPeople } from '@/lib/api';
import type {
  ApolloPersonPreview,
  CompanyResult,
  ComposeEmailParams,
  ICPCriteria,
  TargetContact
} from '@/lib/types';

const EMPTY_ICP: ICPCriteria = {
  description: '',
  industry_keywords: [],
  min_employees: null,
  max_employees: null,
  min_funding_amount: null,
  funding_stages: [],
  hiring_signals: [],
  tech_keywords: [],
  company_examples: []
};

function PersonCard({
  person,
  isEnriching,
  isRanked,
  isSent,
  onEnrich,
  onCompose
}: {
  person: ApolloPersonPreview;
  isEnriching: boolean;
  isRanked: boolean;
  isSent: boolean;
  onEnrich: () => void;
  onCompose?: () => void;
}) {
  const displayName = person.is_enriched
    ? `${person.first_name} ${person.last_name}`
    : `${person.first_name} ${person.last_name_obfuscated}`;

  return (
    <div className="border-border flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {isRanked && <Crown className="text-primary size-3 shrink-0" />}
          {person.has_email && <Mail className="text-primary size-3 shrink-0" />}
          {person.is_enriched && person.email && onCompose ? (
            <button
              type="button"
              onClick={onCompose}
              className="hover:text-primary truncate text-sm font-medium transition-colors"
            >
              {displayName}
            </button>
          ) : (
            <span className="truncate text-sm font-medium">{displayName}</span>
          )}
          {person.is_enriched && person.linkedin_url && (
            <a
              href={person.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary shrink-0 transition-colors"
            >
              <Linkedin className="size-3" />
            </a>
          )}
          {isSent && (
            <span className="text-muted-foreground bg-muted shrink-0 rounded px-1 py-0.5 text-[10px] font-medium">
              Sent
            </span>
          )}
        </div>
        {person.title && (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{person.title}</p>
        )}

        {person.is_enriched && (
          <div className="mt-1.5 space-y-0.5">
            {person.email && (
              <div className="flex items-center gap-1">
                <Mail className="text-muted-foreground size-3 shrink-0" />
                <button
                  type="button"
                  onClick={onCompose}
                  className="text-muted-foreground hover:text-foreground min-w-0 truncate text-xs transition-colors"
                >
                  {person.email}
                </button>
                <CopyButton text={person.email} />
              </div>
            )}
            {person.phone && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground size-3 shrink-0 text-center text-xs">#</span>
                <span className="text-muted-foreground min-w-0 truncate text-xs">
                  {person.phone}
                </span>
                <CopyButton text={person.phone} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {person.is_enriched && person.email && onCompose ? (
          <Button variant="outline" size="icon-xs" label="Compose email" onClick={onCompose}>
            <PenSquare className="size-3" />
          </Button>
        ) : !person.is_enriched ? (
          <Button
            variant="outline"
            size="icon-xs"
            label="Get contact info"
            onClick={onEnrich}
            disabled={isEnriching}
          >
            {isEnriching ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Users className="size-3" />
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ContactList({
  companyName,
  apolloOrgId,
  result,
  rankedIds,
  enrichingPersonIds,
  onEnrichPerson,
  onSelectContact,
  contactedEmails,
  nextCompanyName,
  onNextCompany
}: {
  companyName: string;
  apolloOrgId: string;
  result: CompanyResult | null;
  rankedIds: Set<string>;
  enrichingPersonIds: string[];
  onEnrichPerson: (personId: string, companyName: string) => void;
  onSelectContact: (params: ComposeEmailParams) => void;
  contactedEmails: string[];
  nextCompanyName?: string;
  onNextCompany?: () => void;
}) {
  const [search, setSearch] = useState('');
  const [people, setPeople] = useState<ApolloPersonPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const icp = useResearchStore((s) => s.icp);
  const allPeopleResults = useResearchStore((s) => s.allPeopleResults);
  const peopleResults = useResearchStore((s) => s.peopleResults);

  useEffect(() => {
    setSearch('');

    const cached = allPeopleResults[companyName];
    if (cached && cached.length > 0) {
      setPeople(cached);
      return;
    }

    if (!apolloOrgId || !icp) return;

    setLoading(true);
    searchPeople([apolloOrgId], icp, [{ name: companyName, apollo_org_id: apolloOrgId }])
      .then((results) => {
        const r = results[0];
        if (r) {
          setPeople(r.all_people);
          useResearchStore.setState((state) => ({
            allPeopleResults: { ...state.allPeopleResults, [companyName]: r.all_people }
          }));
        }
      })
      .catch((err) => console.error('Failed to fetch contacts:', err))
      .finally(() => setLoading(false));
  }, [companyName, apolloOrgId, icp, allPeopleResults]);

  // Merge enrichment data, filter by search, sort by rank/email/name — single pass
  const displayPeople = useMemo(() => {
    const enrichedMap = new Map<string, ApolloPersonPreview>();
    for (const p of peopleResults[companyName] ?? []) {
      if (p.is_enriched) enrichedMap.set(p.apollo_person_id, p);
    }

    let list =
      enrichedMap.size > 0 ? people.map((p) => enrichedMap.get(p.apollo_person_id) ?? p) : people;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.first_name.toLowerCase().includes(q) ||
          (p.last_name ?? p.last_name_obfuscated).toLowerCase().includes(q) ||
          (p.title ?? '').toLowerCase().includes(q) ||
          (p.email ?? '').toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      const aRanked = rankedIds.has(a.apollo_person_id) ? 0 : 1;
      const bRanked = rankedIds.has(b.apollo_person_id) ? 0 : 1;
      if (aRanked !== bRanked) return aRanked - bRanked;
      const aEmail = a.has_email ? 0 : 1;
      const bEmail = b.has_email ? 0 : 1;
      if (aEmail !== bEmail) return aEmail - bEmail;
      return a.first_name.localeCompare(b.first_name);
    });
  }, [people, peopleResults, companyName, search, rankedIds]);

  const totalCount = useMemo(() => {
    const enrichedMap = new Map<string, ApolloPersonPreview>();
    for (const p of peopleResults[companyName] ?? []) {
      if (p.is_enriched) enrichedMap.set(p.apollo_person_id, p);
    }
    return enrichedMap.size > 0
      ? people.map((p) => enrichedMap.get(p.apollo_person_id) ?? p).length
      : people.length;
  }, [people, peopleResults, companyName]);

  const composeFor = (person: ApolloPersonPreview) => {
    if (!result || !person.is_enriched || !person.email) return;
    const contact: TargetContact = {
      name: `${person.first_name} ${person.last_name}`,
      title: person.title ?? '',
      email: person.email,
      linkedin_url: person.linkedin_url ?? '',
      is_decision_maker: false
    };
    onSelectContact({ company: result, contact, icp: icp ?? EMPTY_ICP });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-border shrink-0 border-b px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            {loading ? 'Loading contacts...' : `${totalCount} people found`}
          </p>
          {onNextCompany && nextCompanyName && (
            <Button
              variant="default"
              size="xs"
              label={`View ${nextCompanyName} contacts`}
              onClick={onNextCompany}
            >
              {nextCompanyName}
              <ChevronRight className="size-3" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, title, or email..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading contacts...
          </div>
        ) : displayPeople.length === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            {search ? 'No contacts match your search' : 'No contacts found'}
          </div>
        ) : (
          <div className="space-y-2">
            {displayPeople.map((person) => (
              <PersonCard
                key={person.apollo_person_id}
                person={person}
                isEnriching={enrichingPersonIds.includes(person.apollo_person_id)}
                isRanked={rankedIds.has(person.apollo_person_id)}
                isSent={
                  person.is_enriched && person.email
                    ? contactedEmails.includes(person.email)
                    : false
                }
                onEnrich={() => onEnrichPerson(person.apollo_person_id, companyName)}
                onCompose={
                  person.is_enriched && person.email ? () => composeFor(person) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
