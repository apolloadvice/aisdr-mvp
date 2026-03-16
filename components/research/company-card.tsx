'use client';

import { useState } from 'react';
import {
  Building2,
  DollarSign,
  ExternalLink,
  Linkedin,
  ChevronDown,
  Users,
  Crown,
  Mail,
  AtSign
} from 'lucide-react';
import { SignalBadge } from './signal-badge';
import { CopyButton } from './copy-button.client';
import type { CompanyResult, TargetContact } from '@/lib/types';

function ContactRow({ contact, compact }: { contact: TargetContact; compact?: boolean }) {
  return (
    <div className={compact ? 'py-1' : 'py-0.5'}>
      <div className="flex items-center gap-1.5">
        {contact.is_decision_maker && <Crown className="text-primary size-3 shrink-0" />}
        <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{contact.name}</span>
        <a
          href={contact.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
          title={`Find ${contact.name} on LinkedIn`}
        >
          <Linkedin className="size-3" />
        </a>
      </div>
      <p className="text-muted-foreground text-xs">{contact.title}</p>
      {contact.email && (
        <div className="mt-0.5 flex items-center gap-1">
          <AtSign className="text-muted-foreground size-2.5 shrink-0" />
          <a
            href={`mailto:${contact.email}`}
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            {contact.email}
          </a>
          <CopyButton text={contact.email} />
        </div>
      )}
    </div>
  );
}

export function CompanyRow({ result, index }: { result: CompanyResult; index: number }) {
  const [contactsOpen, setContactsOpen] = useState(false);

  const decisionMakers = result.contacts.filter((c) => c.is_decision_maker);
  const otherContacts = result.contacts.filter((c) => !c.is_decision_maker);

  return (
    <div
      className="bg-card animate-in fade-in slide-in-from-bottom-4 border-border fill-mode-both grid grid-cols-[1.2fr_1fr_1.4fr_1.4fr] gap-0 border-b duration-500 last:border-b-0"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      {/* Column 1: Company */}
      <div className="border-border border-r px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{result.company_name}</span>
          {result.website && (
            <a
              href={result.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
        <div className="text-muted-foreground mt-1.5 space-y-0.5 text-xs">
          <div className="flex items-center gap-1">
            <Building2 className="size-3 shrink-0" />
            <span>{result.industry}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="size-3 shrink-0" />
            <span>
              {result.amount_raised} &middot; {result.funding_stage}
            </span>
          </div>
        </div>
      </div>

      {/* Column 2: Target Person */}
      <div className="border-border border-r px-4 py-4">
        {decisionMakers.length > 0 ? (
          <>
            {decisionMakers.map((dm, i) => (
              <div key={i} className={i > 0 ? 'mt-2' : ''}>
                <ContactRow contact={dm} />
              </div>
            ))}
          </>
        ) : result.contacts.length > 0 ? (
          <ContactRow contact={result.contacts[0]} />
        ) : (
          <p className="text-muted-foreground text-xs">No contacts inferred</p>
        )}

        {otherContacts.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setContactsOpen(!contactsOpen)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
            >
              <Users className="size-3" />
              <span>{otherContacts.length} more</span>
              <ChevronDown
                className={`size-3 transition-transform duration-200 ${contactsOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                contactsOpen ? 'mt-2 max-h-80 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-1">
                {otherContacts.map((contact, i) => (
                  <ContactRow key={i} contact={contact} compact />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Company-wide LinkedIn search */}
        <a
          href={result.linkedin_search_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary mt-2.5 inline-flex items-center gap-1 text-xs transition-colors"
        >
          <Linkedin className="size-2.5" />
          Browse all at {result.company_name}
        </a>
      </div>

      {/* Column 3: Buying Signal */}
      <div className="border-border border-r px-4 py-4">
        <div className="space-y-2">
          {result.signals.slice(0, 3).map((signal, i) => (
            <div key={i}>
              <div className="mb-0.5 flex items-center gap-1.5">
                <SignalBadge type={signal.type} />
                <span className="text-xs font-medium">{signal.title}</span>
              </div>
              {signal.key_phrases.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {signal.key_phrases.slice(0, 3).map((phrase, j) => (
                    <span
                      key={j}
                      className="bg-muted text-muted-foreground rounded px-1 py-0.5 text-xs"
                    >
                      {phrase}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{result.match_reason}</p>
      </div>

      {/* Column 4: Company Overview & Fit */}
      <div className="px-4 py-4">
        <p className="text-xs leading-relaxed">{result.company_overview}</p>
        <div className="border-primary/20 bg-primary/5 mt-3 rounded-md border px-2.5 py-2">
          <div className="mb-1 flex items-center gap-1">
            <Mail className="text-primary size-3" />
            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Email Hook
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <p className="flex-1 text-xs italic">&ldquo;{result.email_hook}&rdquo;</p>
            <CopyButton text={result.email_hook} />
          </div>
        </div>
      </div>
    </div>
  );
}
