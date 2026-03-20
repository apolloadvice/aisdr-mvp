'use client';

import { useState } from 'react';
import { Mail, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactList } from './contact-list.client';
import { EmailEditorInline } from './email-editor-inline.client';
import { useResearchStore } from '@/lib/store/research-store';
import type { CompanyResult, ComposeEmailParams } from '@/lib/types';

export function ContactScreen({
  companyName,
  apolloOrgId,
  result,
  onNextCompany,
  nextCompanyName
}: {
  companyName: string;
  apolloOrgId: string;
  result: CompanyResult | null;
  onNextCompany?: () => void;
  nextCompanyName?: string;
}) {
  const [composeParams, setComposeParams] = useState<ComposeEmailParams | null>(null);
  const peopleResults = useResearchStore((s) => s.peopleResults);
  const enrichingPersonIds = useResearchStore((s) => s.enrichingPersonIds);
  const enrichPersonAction = useResearchStore((s) => s.enrichPersonAction);
  const getContactedEmails = useResearchStore((s) => s.getContactedEmails);

  const rankedIds = new Set((peopleResults[companyName] ?? []).map((p) => p.apollo_person_id));

  return (
    <div className="border-border bg-card overflow-hidden rounded-[var(--card-radius)] border">
      {onNextCompany && nextCompanyName && (
        <div className="border-border flex items-center justify-end border-b px-4 py-2">
          <Button variant="ghost" size="sm" onClick={onNextCompany}>
            Next: {nextCompanyName}
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      )}
      <div className="flex" style={{ height: 'calc(100dvh - 300px)', minHeight: '500px' }}>
        {/* Left panel — Contact list (30%) */}
        <div className="border-border w-full shrink-0 overflow-hidden border-r md:w-[30%]">
          <ContactList
            companyName={companyName}
            apolloOrgId={apolloOrgId}
            result={result}
            rankedIds={rankedIds}
            enrichingPersonIds={enrichingPersonIds}
            onEnrichPerson={enrichPersonAction}
            onSelectContact={setComposeParams}
            contactedEmails={getContactedEmails(companyName)}
          />
        </div>

        {/* Right panel — Email editor (70%) */}
        <div className="hidden min-h-0 flex-1 md:block">
          {composeParams ? (
            <EmailEditorInline
              key={composeParams.contact.email ?? composeParams.contact.name}
              params={composeParams}
              onBack={() => setComposeParams(null)}
            />
          ) : (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3">
              <Mail className="size-8 opacity-30" />
              <p className="text-sm">Select a contact to compose an email</p>
            </div>
          )}
        </div>

        {/* Mobile: full-screen email editor overlay */}
        {composeParams && (
          <div className="bg-card absolute inset-0 z-10 md:hidden">
            <EmailEditorInline
              key={`mobile-${composeParams.contact.email ?? composeParams.contact.name}`}
              params={composeParams}
              onBack={() => setComposeParams(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
