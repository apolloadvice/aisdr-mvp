'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Mail, Check, Square, CheckSquare, Send, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion';
import { EmailEditorInline } from './email-editor-inline.client';
import { BulkSendDialog } from './bulk-send-dialog.client';
import { useResearchStore } from '@/lib/store/research-store';
import { Card } from '@/components/ui/card';
import type {
  CompanyResult,
  ComposeEmailParams,
  TargetContact,
  ICPCriteria,
  ApolloPersonPreview
} from '@/lib/types';

const MAX_SELECTED = 5;

const EMPTY_ICP: ICPCriteria = {
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

export interface ComposableContact {
  companyName: string;
  result: CompanyResult;
  contact: TargetContact;
  key: string;
}

interface SidebarContact {
  companyName: string;
  result: CompanyResult;
  person: ApolloPersonPreview;
  key: string;
  isComposable: boolean;
}

export function OutreachStep() {
  const results = useResearchStore((s) => s.results);
  const peopleResults = useResearchStore((s) => s.peopleResults);
  const allPeopleResults = useResearchStore((s) => s.allPeopleResults);
  const icp = useResearchStore((s) => s.icp);
  const getContactedEmails = useResearchStore((s) => s.getContactedEmails);
  const enrichPersonAction = useResearchStore((s) => s.enrichPersonAction);
  const enrichingPersonIds = useResearchStore((s) => s.enrichingPersonIds);
  const fetchOutreachContacts = useResearchStore((s) => s.fetchOutreachContactsAction);
  const isOutreachLoading = useResearchStore((s) => s.isOutreachLoading);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [bulkSendOpen, setBulkSendOpen] = useState(false);

  useEffect(() => {
    fetchOutreachContacts();
  }, [fetchOutreachContacts]);

  const sidebarContacts = useMemo(() => {
    const list: SidebarContact[] = [];
    for (const result of results) {
      const people = [
        ...(peopleResults[result.company_name] ?? []),
        ...(allPeopleResults[result.company_name] ?? [])
      ];
      const seenIds = new Set<string>();
      for (const person of people) {
        if (seenIds.has(person.apollo_person_id)) continue;
        seenIds.add(person.apollo_person_id);
        const isComposable = !!person.is_enriched && !!person.email;
        list.push({
          companyName: result.company_name,
          result,
          person,
          key: isComposable
            ? `${result.company_name}::${person.email}`
            : `${result.company_name}::${person.apollo_person_id}`,
          isComposable
        });
      }
    }
    return list;
  }, [results, peopleResults, allPeopleResults]);

  const companyNames = useMemo(() => {
    const names: string[] = [];
    const seen = new Set<string>();
    for (const c of sidebarContacts) {
      if (!seen.has(c.companyName)) {
        seen.add(c.companyName);
        names.push(c.companyName);
      }
    }
    return names;
  }, [sidebarContacts]);

  const grouped = useMemo(() => {
    const map = new Map<string, SidebarContact[]>();
    for (const c of sidebarContacts) {
      const list = map.get(c.companyName) ?? [];
      list.push(c);
      map.set(c.companyName, list);
    }
    return map;
  }, [sidebarContacts]);

  const composableContacts = useMemo(
    () =>
      sidebarContacts
        .filter((c) => c.isComposable)
        .map(
          (c): ComposableContact => ({
            companyName: c.companyName,
            result: c.result,
            contact: {
              name: `${c.person.first_name} ${c.person.last_name}`,
              title: c.person.title ?? '',
              email: c.person.email!,
              linkedin_url: c.person.linkedin_url ?? '',
              is_decision_maker: false
            },
            key: c.key
          })
        ),
    [sidebarContacts]
  );

  const toggleContact = useCallback(
    (key: string) => {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
          if (activeKey === key) {
            const remaining = [...next];
            setActiveKey(remaining.length > 0 ? remaining[0] : null);
          }
        } else {
          if (next.size >= MAX_SELECTED) return prev;
          next.add(key);
          setActiveKey(key);
        }
        return next;
      });
    },
    [activeKey]
  );

  const selectAll = useCallback(() => {
    const keys = new Set(composableContacts.slice(0, MAX_SELECTED).map((c) => c.key));
    setSelectedKeys(keys);
    setActiveKey(composableContacts[0]?.key ?? null);
  }, [composableContacts]);

  const selectedContacts = useMemo(
    () => composableContacts.filter((c) => selectedKeys.has(c.key)),
    [composableContacts, selectedKeys]
  );

  const activeContact = composableContacts.find((c) => c.key === activeKey) ?? null;
  const composeParams: ComposeEmailParams | null = activeContact
    ? { company: activeContact.result, contact: activeContact.contact, icp: icp ?? EMPTY_ICP }
    : null;

  if (sidebarContacts.length === 0 && !isOutreachLoading) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-sm">
          No contacts found yet. Go back to Contacts to discover people, then return here to compose
          outreach.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => useResearchStore.getState().setStep('results')}
        >
          Back to Contacts
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row" style={{ height: 'min(700px, 70vh)' }}>
      {/* Contact sidebar */}
      <Card className="flex w-full shrink-0 flex-col !gap-0 overflow-hidden !py-0 md:w-72 lg:w-80">
        <div className="border-border flex items-center gap-1 border-b px-4 py-3">
          <p className="text-xs font-medium">
            {selectedKeys.size}/{MAX_SELECTED} selected
          </p>
          {composableContacts.length > 0 &&
            composableContacts.length <= MAX_SELECTED &&
            selectedKeys.size === 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary h-7 text-xs font-medium"
                onClick={selectAll}
              >
                Select All
              </Button>
            )}
          {selectedKeys.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 text-xs"
              onClick={() => {
                setSelectedKeys(new Set());
                setActiveKey(null);
              }}
            >
              Clear
            </Button>
          )}
          <Button
            size="sm"
            className="ml-auto h-7 gap-1 px-2.5 text-xs"
            onClick={() => setBulkSendOpen(true)}
            disabled={selectedKeys.size === 0}
          >
            <Send className="size-3" />
            Send All
          </Button>
        </div>

        {isOutreachLoading && (
          <div className="flex items-center gap-2 px-4 py-3">
            <Loader2 className="text-muted-foreground size-3 animate-spin" />
            <span className="text-muted-foreground text-xs">Loading contacts...</span>
          </div>
        )}

        <Accordion
          type="multiple"
          defaultValue={companyNames}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          {[...grouped.entries()].map(([companyName, companyContacts]) => {
            const contactedEmails = getContactedEmails(companyName);
            const contactCount = companyContacts.length;
            return (
              <AccordionItem key={companyName} value={companyName} className="border-border">
                <AccordionTrigger className="px-4 py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{companyName}</span>
                    <span className="text-muted-foreground text-[10px]">{contactCount}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0 [&_p]:mb-0">
                  {companyContacts.map((c) => {
                    if (!c.isComposable) {
                      const isEnriching = enrichingPersonIds.includes(c.person.apollo_person_id);
                      const displayName = `${c.person.first_name} ${c.person.last_name_obfuscated}`;
                      return (
                        <div
                          key={c.key}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-muted-foreground truncate text-sm leading-none">
                              {displayName}
                            </p>
                            <p className="text-muted-foreground/60 truncate text-xs leading-none">
                              {c.person.title}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="icon-xs"
                            className="shrink-0"
                            disabled={isEnriching}
                            label={isEnriching ? 'Loading...' : 'Get Contact'}
                            onClick={() =>
                              enrichPersonAction(c.person.apollo_person_id, c.companyName)
                            }
                          >
                            {isEnriching ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Users className="size-3" />
                            )}
                          </Button>
                        </div>
                      );
                    }

                    const isSent = contactedEmails.includes(c.person.email ?? '');
                    const isSelected = selectedKeys.has(c.key);
                    const isAtLimit = selectedKeys.size >= MAX_SELECTED && !isSelected;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => toggleContact(c.key)}
                        disabled={isAtLimit}
                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors ${
                          isSelected ? 'bg-muted' : isAtLimit ? 'opacity-40' : 'hover:bg-muted/50'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="text-primary size-4 shrink-0" />
                        ) : (
                          <Square className="text-muted-foreground/40 size-4 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm leading-none font-medium">
                            {c.person.first_name} {c.person.last_name}
                          </p>
                          <p className="text-muted-foreground truncate text-xs leading-none">
                            {c.person.title}
                          </p>
                        </div>
                        {isSent && (
                          <span className="text-muted-foreground flex items-center gap-0.5 text-[10px]">
                            <Check className="size-3" />
                            Sent
                          </span>
                        )}
                      </button>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </Card>

      {/* Email editor with tabs */}
      <Card className="min-h-0 flex-1 !gap-0 overflow-hidden !py-0">
        {/* Tabs */}
        {selectedContacts.length > 0 && (
          <div className="border-border flex shrink-0 gap-0 overflow-x-auto border-b">
            {selectedContacts.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveKey(c.key)}
                className={`shrink-0 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                  activeKey === c.key
                    ? 'border-border text-foreground'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                }`}
              >
                {c.contact.name.split(' ')[0]}{' '}
                <span className="text-muted-foreground font-normal">
                  {c.companyName.length > 15 ? c.companyName.slice(0, 15) + '...' : c.companyName}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Editor */}
        <div className="min-h-0 flex-1">
          {composeParams ? (
            <EmailEditorInline key={activeKey} params={composeParams} />
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <div className="text-center">
                <Mail className="text-muted-foreground/30 mx-auto mb-3 size-8" />
                <p className="text-muted-foreground text-sm">Select contacts to compose emails</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <BulkSendDialog
        open={bulkSendOpen}
        onOpenChange={setBulkSendOpen}
        contacts={selectedContacts}
      />
    </div>
  );
}
