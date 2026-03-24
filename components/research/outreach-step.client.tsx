'use client';

import { useState, useMemo, useCallback } from 'react';
import { Mail, Check, Square, CheckSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmailEditorInline } from './email-editor-inline.client';
import { BulkSendDialog } from './bulk-send-dialog.client';
import { useResearchStore } from '@/lib/store/research-store';
import type { CompanyResult, ComposeEmailParams, TargetContact, ICPCriteria } from '@/lib/types';

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

export function OutreachStep() {
  const results = useResearchStore((s) => s.results);
  const peopleResults = useResearchStore((s) => s.peopleResults);
  const allPeopleResults = useResearchStore((s) => s.allPeopleResults);
  const icp = useResearchStore((s) => s.icp);
  const getContactedEmails = useResearchStore((s) => s.getContactedEmails);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [bulkSendOpen, setBulkSendOpen] = useState(false);

  const contacts = useMemo(() => {
    const list: ComposableContact[] = [];
    for (const result of results) {
      const people = [
        ...(peopleResults[result.company_name] ?? []),
        ...(allPeopleResults[result.company_name] ?? [])
      ];
      const seen = new Set<string>();
      for (const person of people) {
        if (!person.is_enriched || !person.email || seen.has(person.email)) continue;
        seen.add(person.email);
        list.push({
          companyName: result.company_name,
          result,
          contact: {
            name: `${person.first_name} ${person.last_name}`,
            title: person.title ?? '',
            email: person.email,
            linkedin_url: person.linkedin_url ?? '',
            is_decision_maker: false
          },
          key: `${result.company_name}::${person.email}`
        });
      }
    }
    return list;
  }, [results, peopleResults, allPeopleResults]);

  const grouped = useMemo(() => {
    const map = new Map<string, ComposableContact[]>();
    for (const c of contacts) {
      const list = map.get(c.companyName) ?? [];
      list.push(c);
      map.set(c.companyName, list);
    }
    return map;
  }, [contacts]);

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
    const keys = new Set(contacts.slice(0, MAX_SELECTED).map((c) => c.key));
    setSelectedKeys(keys);
    setActiveKey(contacts[0]?.key ?? null);
  }, [contacts]);

  const selectedContacts = useMemo(
    () => contacts.filter((c) => selectedKeys.has(c.key)),
    [contacts, selectedKeys]
  );

  const activeContact = contacts.find((c) => c.key === activeKey) ?? null;
  const composeParams: ComposeEmailParams | null = activeContact
    ? { company: activeContact.result, contact: activeContact.contact, icp: icp ?? EMPTY_ICP }
    : null;

  if (contacts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-sm">
          No enriched contacts yet. Go back to Contacts to unlock contact info, then return here to
          compose outreach.
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
    <div className="flex flex-col gap-4 md:flex-row" style={{ minHeight: 'min(600px, 70vh)' }}>
      {/* Contact sidebar */}
      <div className="border-border bg-card w-full shrink-0 overflow-y-auto rounded-(--card-radius) border md:w-72 lg:w-80">
        <div className="border-border flex items-center gap-1 border-b px-4 py-3">
          <p className="text-xs font-medium">
            {selectedKeys.size}/{MAX_SELECTED} selected
          </p>
          {contacts.length <= MAX_SELECTED && selectedKeys.size === 0 && (
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
        <div className="divide-border divide-y">
          {[...grouped.entries()].map(([companyName, companyContacts]) => {
            const contactedEmails = getContactedEmails(companyName);
            return (
              <div key={companyName}>
                <div className="bg-muted/30 px-4 py-2">
                  <p className="text-muted-foreground text-xs font-medium">{companyName}</p>
                </div>
                {companyContacts.map((c) => {
                  const isSent = contactedEmails.includes(c.contact.email ?? '');
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
                        <p className="truncate text-sm font-medium">{c.contact.name}</p>
                        <p className="text-muted-foreground truncate text-xs">{c.contact.title}</p>
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Email editor with tabs */}
      <div className="border-border bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-(--card-radius) border">
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
                    ? 'border-primary text-foreground'
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
      </div>

      <BulkSendDialog
        open={bulkSendOpen}
        onOpenChange={setBulkSendOpen}
        contacts={selectedContacts}
      />
    </div>
  );
}
