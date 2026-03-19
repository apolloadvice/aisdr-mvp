'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Mail, ExternalLink } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import type { SentEmail } from '@/lib/types';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

function MobileEmailSheet({ email, onClose }: { email: SentEmail | null; onClose: () => void }) {
  const isMobile = useIsMobile();
  return (
    <Sheet open={!!email && isMobile} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[80dvh]">
        <SheetHeader>
          <SheetTitle className="truncate">{email?.subject ?? 'Email Detail'}</SheetTitle>
          <SheetDescription className="sr-only">Email detail view</SheetDescription>
        </SheetHeader>
        {email && (
          <div className="overflow-y-auto px-4 pb-4">
            <EmailDetailContent email={email} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function EmailDetailContent({ email }: { email: SentEmail }) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-muted-foreground text-xs font-medium">To</label>
          <div className="text-foreground bg-muted/50 border-border rounded-md border px-3 py-2 text-sm">
            {email.recipient_email}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-muted-foreground text-xs font-medium">Subject</label>
          <div className="text-foreground bg-muted/50 border-border rounded-md border px-3 py-2 text-sm">
            {email.subject}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col space-y-1.5">
        <label className="text-muted-foreground text-xs font-medium">Body</label>
        <div className="text-foreground bg-muted/50 border-border flex-1 overflow-y-auto rounded-md border px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap">
          {email.body}
        </div>
      </div>
      {email.session_id && (
        <Link
          href={`/research/${email.session_id}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
        >
          <ExternalLink className="size-3" />
          View Session
        </Link>
      )}
      {email.error_message && (
        <p className="text-destructive text-xs">Error: {email.error_message}</p>
      )}
    </div>
  );
}

export function SentEmailsPage({ emails }: { emails: SentEmail[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = emails.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-accent-secondary/10 flex size-9 items-center justify-center rounded-lg">
          <Mail className="text-accent-secondary size-4" />
        </div>
        <div>
          <h1 className="text-foreground text-lg font-semibold">Sent Emails</h1>
          <p className="text-muted-foreground text-xs">
            {emails.length === 0
              ? 'No emails sent yet'
              : `${emails.length} email${emails.length === 1 ? '' : 's'} sent`}
          </p>
        </div>
      </div>

      {emails.length === 0 ? (
        <div className="border-border rounded-lg border py-16 text-center">
          <p className="text-muted-foreground text-sm">
            Compose an email from a researched company to get started.
          </p>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Email list */}
          <div className="bg-card border-border w-full shrink-0 overflow-hidden rounded-lg border md:w-3/5">
            {emails.map((email) => (
              <button
                key={email.id}
                type="button"
                onClick={() => setSelectedId(email.id)}
                className={`border-border flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 ${
                  selectedId === email.id ? 'bg-muted/70' : 'hover:bg-muted/40'
                }`}
              >
                {email.status === 'sent' ? (
                  <CheckCircle className="text-primary size-3.5 shrink-0" />
                ) : (
                  <XCircle className="text-destructive size-3.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-foreground truncate text-sm font-medium">
                      {email.recipient_name || email.recipient_email}
                    </span>
                    {email.company_name && (
                      <span className="text-muted-foreground truncate text-xs">
                        {email.company_name}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">{email.subject}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {email.session_id && (
                    <Link
                      href={`/research/${email.session_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="View research session"
                    >
                      <ExternalLink className="size-3" />
                    </Link>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {formatDate(email.created_at)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Desktop email preview */}
          <div className="bg-card border-border hidden min-h-[400px] flex-1 flex-col rounded-lg border md:flex">
            {selected ? (
              <EmailDetailContent email={selected} />
            ) : (
              <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
                Select an email to preview
              </div>
            )}
          </div>

          {/* Mobile email detail sheet */}
          <MobileEmailSheet email={selected} onClose={() => setSelectedId(null)} />
        </div>
      )}
    </div>
  );
}
