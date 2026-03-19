'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, RefreshCw, Loader2, Link2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ComposeEmailParams, GeneratedEmail } from '@/lib/types';
import { generateEmailSequence, sendEmail as sendEmailApi, getGmailStatus } from '@/lib/api';
import { useProfileStore } from '@/lib/store/profile-store';
import { useResearchStore } from '@/lib/store/research-store';

const STEP_LABELS = ['Email 1', 'Email 2', 'Email 3'] as const;

export function EmailEditorPanel({
  open,
  params,
  onClose
}: {
  open: boolean;
  params: ComposeEmailParams | null;
  onClose: () => void;
}) {
  const [toEmail, setToEmail] = useState('');
  const [steps, setSteps] = useState<[GeneratedEmail, GeneratedEmail, GeneratedEmail] | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailChecked, setGmailChecked] = useState(false);

  // Check Gmail connection on mount
  useEffect(() => {
    getGmailStatus().then((status) => {
      setGmailConnected(status.connected);
      setGmailChecked(true);
    });
  }, []);

  // Load step content into editor fields
  const loadStep = useCallback(
    (stepIndex: number, emailSteps: [GeneratedEmail, GeneratedEmail, GeneratedEmail] | null) => {
      if (!emailSteps) return;
      const step = emailSteps[stepIndex];
      setSubject(step.subject);
      setBody(step.body);
      setActiveStep(stepIndex);
    },
    []
  );

  // Save current edits back to the steps array before switching
  const saveCurrentStep = useCallback(() => {
    setSteps((prev) => {
      if (!prev) return prev;
      const updated = [...prev] as [GeneratedEmail, GeneratedEmail, GeneratedEmail];
      updated[activeStep] = { subject, body };
      return updated;
    });
  }, [activeStep, subject, body]);

  // Generate sequence when panel opens with new params
  useEffect(() => {
    if (!params || !open) return;

    setToEmail(params.contact.email ?? '');
    setSendResult(null);
    setActiveStep(0);
    setSteps(null);

    const controller = new AbortController();
    setGenerating(true);
    generateEmailSequence(params.company, params.contact, params.icp, controller.signal)
      .then((sequence) => {
        setSteps(sequence.emails);
        loadStep(0, sequence.emails);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          const signalTitle = params.company.signals[0]?.title ?? 'Introduction';
          const fallback: [GeneratedEmail, GeneratedEmail, GeneratedEmail] = [
            {
              subject: `${signalTitle} — ${params.company.company_name}`,
              body: ''
            },
            { subject: `Re: ${signalTitle} — ${params.company.company_name}`, body: '' },
            { subject: `Re: ${signalTitle} — ${params.company.company_name}`, body: '' }
          ];
          setSteps(fallback);
          loadStep(0, fallback);
        }
      })
      .finally(() => setGenerating(false));

    return () => controller.abort();
  }, [params, open, loadStep]);

  const handleStepChange = useCallback(
    (newStep: number) => {
      saveCurrentStep();
      setSteps((prev) => {
        if (!prev) return prev;
        // Save current edits first
        const updated = [...prev] as [GeneratedEmail, GeneratedEmail, GeneratedEmail];
        updated[activeStep] = { subject, body };
        // Then load new step
        const step = updated[newStep];
        setSubject(step.subject);
        setBody(step.body);
        setActiveStep(newStep);
        return updated;
      });
      setSendResult(null);
    },
    [activeStep, subject, body, saveCurrentStep]
  );

  const handleRegenerate = useCallback(async () => {
    if (!params) return;
    setGenerating(true);
    setSendResult(null);
    try {
      const sequence = await generateEmailSequence(params.company, params.contact, params.icp);
      setSteps(sequence.emails);
      loadStep(activeStep, sequence.emails);
    } catch {
      // keep current content
    } finally {
      setGenerating(false);
    }
  }, [params, activeStep, loadStep]);


  const handleSend = useCallback(async () => {
    if (!params || !toEmail) return;
    setSending(true);
    setSendResult(null);
    const sessionId = useResearchStore.getState().sessionId;
    try {
      const result = await sendEmailApi({
        to: toEmail,
        subject,
        body,
        companyName: params.company.company_name,
        contactName: params.contact.name,
        ...(sessionId ? { sessionId } : {})
      });
      if (result.success) {
        setSendResult({ type: 'success', message: 'Email sent successfully' });
      } else {
        setSendResult({ type: 'error', message: result.error ?? 'Send failed' });
      }
    } catch (err) {
      setSendResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Send failed'
      });
    } finally {
      setSending(false);
    }
  }, [params, toEmail, subject, body]);

  const company = params?.company;
  const contact = params?.contact;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" size="lg">
        <SheetHeader>
          <SheetTitle>{company?.company_name ?? ''}</SheetTitle>
          <SheetDescription>{contact ? `${contact.name} · ${contact.title}` : ''}</SheetDescription>
        </SheetHeader>

        <SheetBody className="flex flex-col gap-4">
          {/* Step navigation */}
          <div className="flex items-center gap-1">
            {STEP_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => handleStepChange(i)}
                disabled={generating}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeStep === i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground text-[11px]">Each email is sent individually</p>

          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">To</label>
            <Input
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="No email found"
              type="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={generating}
              placeholder={generating ? 'Generating...' : ''}
            />
          </div>

          <div className="flex flex-1 flex-col space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">Body</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-52 flex-1 resize-none"
              disabled={generating}
              placeholder={generating ? 'Generating personalized email sequence...' : ''}
            />
          </div>

          {sendResult && (
            <p
              className={`text-sm ${
                sendResult.type === 'success' ? 'text-primary' : 'text-destructive'
              }`}
            >
              {sendResult.message}
            </p>
          )}
        </SheetBody>

        <SheetFooter className="flex-row border-t">
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            {generating ? 'Generating...' : 'Regenerate'}
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {/* Step navigation arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStepChange(activeStep - 1)}
                disabled={activeStep === 0 || generating}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-muted-foreground text-xs tabular-nums">{activeStep + 1}/3</span>
              <button
                type="button"
                onClick={() => handleStepChange(activeStep + 1)}
                disabled={activeStep === 2 || generating}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            {gmailChecked && !gmailConnected && (
              <button
                type="button"
                onClick={() => useProfileStore.getState().openProfile('connections')}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
              >
                <Link2 className="size-3" />
                Connect Gmail
              </button>
            )}
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!gmailConnected || !toEmail || generating || sending}
              title={!gmailConnected ? 'Connect Gmail in Settings to send' : undefined}
            >
              {sending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
