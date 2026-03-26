'use client';

import { useState, useMemo } from 'react';
import { Building2, ExternalLink, X, Plus, RefreshCw, MapPin } from 'lucide-react';
import { CompanyLogoWithFallback } from '@/components/shared/company-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingStatus } from './loading-status';
import { StrategyChat } from './strategy-chat.client';
import { useResearchStore } from '@/lib/store/research-store';
import { Card } from '@/components/ui/card';
import type { DiscoveredCompanyPreview } from '@/lib/types';

const MAX_SELECTED = 5;

function Checkbox({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <div
      className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
      } ${className ?? ''}`}
    >
      {checked && (
        <svg className="size-3" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

function LinkedInIcon() {
  return (
    <svg className="size-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function FilterChip({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label}
    </button>
  );
}

function CompanyRow({
  company,
  selected,
  disabled,
  previouslyResearched,
  index,
  onToggle
}: {
  company: DiscoveredCompanyPreview;
  selected: boolean;
  disabled: boolean;
  previouslyResearched: boolean;
  index: number;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`animate-in fade-in slide-in-from-bottom-2 fill-mode-both border-border flex w-full items-start gap-4 border-b px-4 py-3 text-left transition-colors duration-300 last:border-b-0 ${
        selected
          ? 'bg-card hover:bg-muted/30'
          : disabled
            ? 'bg-card cursor-not-allowed opacity-30'
            : 'bg-card opacity-50 hover:opacity-70'
      }`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <Checkbox checked={selected} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <CompanyLogoWithFallback
            name={company.name}
            website={company.website}
            logoUrl={company.logo_url}
            size="sm"
          />
          <span className="text-sm font-medium">{company.name}</span>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="Website"
            >
              <ExternalLink className="size-3" />
            </a>
          )}
          {company.linkedin_url && (
            <a
              href={company.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="LinkedIn"
            >
              <LinkedInIcon />
            </a>
          )}
          {previouslyResearched && (
            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
              Previously Researched
            </span>
          )}
        </div>
        {company.description && (
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            {company.description}
          </p>
        )}
        {company.location && (
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            <MapPin className="mr-0.5 inline size-2.5" />
            {company.location}
          </p>
        )}
      </div>
    </button>
  );
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      className="border-border flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="border-border size-4 rounded border" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
        <div className="bg-muted h-3 w-2/3 animate-pulse rounded" />
      </div>
    </div>
  );
}

export function ConfirmStep() {
  const candidates = useResearchStore((s) => s.candidates);
  const selected = useResearchStore((s) => s.selectedCompanies);
  const setSelectedCompanies = useResearchStore((s) => s.setSelectedCompanies);
  const isDiscovering = useResearchStore((s) => s.isDiscovering);
  const statusMessage = useResearchStore((s) => s.statusMessage);
  const error = useResearchStore((s) => s.error);
  const previouslyResearched = useResearchStore((s) => s.previouslyResearched);
  const icpChangedSinceDiscovery = useResearchStore((s) => s.icpChangedSinceDiscovery);
  const discover = useResearchStore((s) => s.discover);

  const [adding, setAdding] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [locationFilter, setLocationFilter] = useState<string | null>(null);

  const selectedSet = new Set(selected);
  const atLimit = selected.length >= MAX_SELECTED;

  const uniqueLocations = useMemo(() => {
    const locs = candidates.map((c) => c.location).filter(Boolean) as string[];
    return [...new Set(locs)].sort();
  }, [candidates]);

  const filteredCandidates = useMemo(
    () => (locationFilter ? candidates.filter((c) => c.location === locationFilter) : candidates),
    [candidates, locationFilter]
  );

  const toggle = (name: string) => {
    if (selectedSet.has(name)) {
      setSelectedCompanies(selected.filter((n) => n !== name));
    } else if (!atLimit) {
      setSelectedCompanies([...selected, name]);
    }
  };

  const addCustom = () => {
    const trimmed = newCompany.trim();
    if (trimmed && !selectedSet.has(trimmed) && !atLimit) {
      setSelectedCompanies([...selected, trimmed]);
      setNewCompany('');
      setAdding(false);
    }
  };

  const candidateNames = new Set(candidates.map((c) => c.name));
  const customNames = selected.filter((n) => !candidateNames.has(n));
  const allFiltered = filteredCandidates.length > 0;
  const allSelected = allFiltered && filteredCandidates.every((c) => selectedSet.has(c.name));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedCompanies(customNames);
    } else {
      const allNames = [...filteredCandidates.map((c) => c.name), ...customNames];
      setSelectedCompanies([...new Set(allNames)].slice(0, MAX_SELECTED));
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4 shrink-0">
        <h2 className="text-xl font-semibold tracking-tight">Confirm companies</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Select which companies to deep-research. You can add or remove from the list.
        </p>
      </div>

      {error && <p className="text-destructive mb-3 shrink-0 text-sm">{error}</p>}

      {isDiscovering && (
        <LoadingStatus
          statusMessage={statusMessage}
          subtitle="Finding companies that match your ICP"
        />
      )}

      <div className="flex flex-col gap-4 lg:h-[640px] lg:flex-row">
        {/* Chat */}
        <div className="w-full shrink-0 lg:h-full lg:w-80">
          <StrategyChat />
        </div>

        {/* Company list */}
        <div className="flex min-w-0 flex-1 flex-col">
          {icpChangedSinceDiscovery && !isDiscovering && (
            <div className="mb-3 shrink-0">
              <Button variant="outline" size="sm" onClick={() => discover()}>
                <RefreshCw className="size-3.5" />
                Re-discover companies
              </Button>
            </div>
          )}

          {uniqueLocations.length > 1 && (
            <div className="mb-3 flex shrink-0 flex-wrap items-center gap-1.5">
              <MapPin className="text-muted-foreground size-3.5" />
              <FilterChip
                label="All"
                active={locationFilter === null}
                onClick={() => setLocationFilter(null)}
              />
              {uniqueLocations.map((loc) => (
                <FilterChip
                  key={loc}
                  label={loc}
                  active={locationFilter === loc}
                  onClick={() => setLocationFilter(locationFilter === loc ? null : loc)}
                />
              ))}
            </div>
          )}

          <Card className="min-h-0 flex-1 !gap-0 !py-0">
            {/* Header */}
            <div className="bg-muted/50 border-border flex shrink-0 items-center gap-4 border-b px-4 py-2.5">
              {allFiltered && (
                <button onClick={toggleAll}>
                  <Checkbox checked={allSelected} />
                </button>
              )}
              <span className="text-muted-foreground section-label">Company</span>
              <span
                className={`ml-auto text-xs ${atLimit ? 'text-primary font-medium' : 'text-muted-foreground'}`}
              >
                {selected.length}/{MAX_SELECTED} selected
              </span>
            </div>

            {/* Scrollable rows */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {isDiscovering &&
                candidates.length === 0 &&
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} index={i} />)}

              {filteredCandidates.map((company, i) => (
                <CompanyRow
                  key={company.name}
                  company={company}
                  selected={selectedSet.has(company.name)}
                  disabled={!selectedSet.has(company.name) && atLimit}
                  previouslyResearched={previouslyResearched.has(company.name)}
                  index={i}
                  onToggle={() => toggle(company.name)}
                />
              ))}

              {customNames.map((name) => (
                <div
                  key={name}
                  className="border-border flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
                >
                  <Checkbox checked />
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <Building2 className="text-muted-foreground size-3.5 shrink-0" />
                    <span className="text-sm font-medium">{name}</span>
                    <span className="bg-accent-tertiary/10 text-accent-tertiary rounded px-1.5 py-0.5 text-xs">
                      Custom
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedCompanies(selected.filter((n) => n !== name))}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add custom — pinned */}
            <div className="border-border shrink-0 border-t px-4 py-2.5">
              {adding ? (
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addCustom();
                      if (e.key === 'Escape') setAdding(false);
                    }}
                    placeholder="Company name..."
                    className="h-8 flex-1 text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={addCustom} disabled={!newCompany.trim() || atLimit}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  disabled={atLimit}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    atLimit
                      ? 'text-muted-foreground/40 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Plus className="size-3.5" />
                  Add a company
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
