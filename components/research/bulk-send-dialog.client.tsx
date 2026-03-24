'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sendEmail as sendEmailApi, getGmailStatus } from '@/lib/api';
import { useResearchStore } from '@/lib/store/research-store';
import { useSignatureStore } from '@/lib/store/signature-store';
import type { GeneratedEmail, GeneratedEmailSequence } from '@/lib/types';
import type { ComposableContact } from './outreach-step.client';

type SendStatus = 'pending' | 'sending' | 'sent' | 'failed';

const STEP_LABELS = ['Email 1', 'Email 2', 'Email 3'] as const;

interface DraftItem {
  contact: ComposableContact;
  sequence: GeneratedEmailSequence | null;
  stepIndex: number;
  toEmail: string;
  status: SendStatus;
  error?: string;
}

function getEmail(draft: DraftItem): GeneratedEmail {
  return draft.sequence?.emails[draft.stepIndex] ?? { subject: '', body: '' };
}

export function BulkSendDialog({
  open,
  onOpenChange,
  contacts
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: ComposableContact[];
}) {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [globalStep, setGlobalStep] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailChecked, setGmailChecked] = useState(false);

  const signatures = useSignatureStore((s) => s.signatures);
  const defaultSignature = signatures.find((s) => s.is_default) ?? null;

  useEffect(() => {
    if (!open) return;

    getGmailStatus().then((s) => {
      setGmailConnected(s.connected);
      setGmailChecked(true);
    });

    const store = useResearchStore.getState();
    const items: DraftItem[] = [];

    for (const c of contacts) {
      const contactKey = c.contact.email ?? c.contact.name;
      const cached = store.getEmailSequence(c.companyName, contactKey);
      items.push({
        contact: c,
        sequence: cached,
        stepIndex: 0,
        toEmail: c.contact.email ?? '',
        status: 'pending'
      });
    }

    setDrafts(items);
    setGlobalStep(0);
    setIsSending(false);
  }, [open, contacts]);

  // When global step changes, update all pending drafts
  const handleGlobalStepChange = useCallback((step: number) => {
    setGlobalStep(step);
    setDrafts((prev) => prev.map((d) => (d.status === 'pending' ? { ...d, stepIndex: step } : d)));
  }, []);

  const handleDraftStepChange = useCallback((index: number, step: number) => {
    setDrafts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], stepIndex: step };
      return next;
    });
  }, []);

  const readyDrafts = drafts.filter((d) => {
    const email = getEmail(d);
    return d.toEmail && email.subject && email.body;
  });
  const sentCount = drafts.filter((d) => d.status === 'sent').length;
  const failedCount = drafts.filter((d) => d.status === 'failed').length;
  const isDone = isSending && drafts.every((d) => d.status === 'sent' || d.status === 'failed');

  const handleSendAll = useCallback(async () => {
    setIsSending(true);
    const sessionId = useResearchStore.getState().sessionId;

    for (let i = 0; i < drafts.length; i++) {
      const draft = drafts[i];
      const email = getEmail(draft);
      if (!draft.toEmail || !email.subject || !email.body) {
        setDrafts((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], status: 'failed', error: 'Missing email data' };
          return next;
        });
        continue;
      }

      setDrafts((prev) => {
        const next = [...prev];
        next[i] = { ...next[i], status: 'sending' };
        return next;
      });

      const finalBody = defaultSignature ? `${email.body}\n\n${defaultSignature.body}` : email.body;

      try {
        const result = await sendEmailApi({
          to: draft.toEmail,
          subject: email.subject,
          body: finalBody,
          companyName: draft.contact.companyName,
          contactName: draft.contact.contact.name,
          ...(sessionId ? { sessionId } : {})
        });

        setDrafts((prev) => {
          const next = [...prev];
          next[i] = {
            ...next[i],
            status: result.success ? 'sent' : 'failed',
            error: result.success ? undefined : (result.error ?? 'Send failed')
          };
          return next;
        });
      } catch (err) {
        setDrafts((prev) => {
          const next = [...prev];
          next[i] = {
            ...next[i],
            status: 'failed',
            error: err instanceof Error ? err.message : 'Send failed'
          };
          return next;
        });
      }
    }
  }, [drafts, defaultSignature]);

  return (
    <Dialog open={open} onOpenChange={isSending && !isDone ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isDone
              ? `Sent ${sentCount} of ${drafts.length} emails`
              : `Send ${readyDrafts.length} emails`}
          </DialogTitle>
          <DialogDescription>
            {isDone
              ? failedCount > 0
                ? `${failedCount} failed. You can retry individually from the editor.`
                : 'All emails sent successfully.'
              : 'Choose which email in the sequence to send for each contact.'}
          </DialogDescription>
        </DialogHeader>

        {/* Global step selector */}
        {!isDone && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium">Send:</span>
            <div className="flex gap-1">
              {STEP_LABELS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleGlobalStepChange(i)}
                  disabled={isSending}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    globalStep === i
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <ScrollArea className="max-h-80">
          <div className="space-y-2 pr-4">
            {drafts.map((draft, i) => {
              const email = getEmail(draft);
              return (
                <div
                  key={draft.contact.key}
                  className="border-border bg-muted/30 rounded-lg border p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {draft.status === 'sending' && (
                        <Loader2 className="text-primary size-4 animate-spin" />
                      )}
                      {draft.status === 'sent' && <CheckCircle className="size-4 text-green-500" />}
                      {draft.status === 'failed' && <XCircle className="size-4 text-red-500" />}
                      {draft.status === 'pending' && (
                        <Mail className="text-muted-foreground size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <p className="truncate text-sm font-medium">{draft.contact.contact.name}</p>
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {draft.contact.companyName}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 truncate text-xs">
                        {draft.toEmail}
                      </p>
                      <p className="text-foreground mt-1 truncate text-xs">
                        {email.subject || 'No subject'}
                      </p>
                      {draft.error && <p className="mt-1 text-xs text-red-500">{draft.error}</p>}
                    </div>
                    {/* Per-contact step override */}
                    {draft.status === 'pending' && !isSending && draft.sequence && (
                      <div className="flex shrink-0 gap-0.5">
                        {STEP_LABELS.map((_, si) => (
                          <button
                            key={si}
                            type="button"
                            onClick={() => handleDraftStepChange(i, si)}
                            className={`size-6 rounded text-[10px] font-medium transition-colors ${
                              draft.stepIndex === si
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {si + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          {isDone ? (
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendAll}
                disabled={!gmailConnected || readyDrafts.length === 0 || isSending}
              >
                {!gmailChecked ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : isSending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Sending {sentCount + failedCount + 1}/{drafts.length}
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    Send All ({readyDrafts.length})
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
