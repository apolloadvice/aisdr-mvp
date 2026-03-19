'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, RefreshCw, Loader2, Link2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ComposeEmailParams, GeneratedEmail } from '@/lib/types';
import { toast } from 'sonner';
import { generateEmailSequence, sendEmail as sendEmailApi, getGmailStatus } from '@/lib/api';
import { useProfileStore } from '@/lib/store/profile-store';
import { useResearchStore } from '@/lib/store/research-store';
import { useSignatureStore } from '@/lib/store/signature-store';

const STEP_LABELS = ['Email 1', 'Email 2', 'Email 3'] as const;

function renderLines(text: string) {
  return text.split('\n').map((line, i) =>
    line.trim() === '' ? (
      <br key={i} />
    ) : (
      <p key={i} className="mb-0.5">
        {line}
      </p>
    )
  );
}

function EmailPreview({
  toEmail,
  subject,
  body,
  signatureBody
}: {
  toEmail: string;
  subject: string;
  body: string;
  signatureBody: string | null;
}) {
  return (
    <div className="bg-muted/30 border-border flex h-full flex-col rounded-lg border">
      <div className="border-border space-y-1 border-b px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-muted-foreground text-xs font-medium">To:</span>
          <span className="text-foreground text-sm">{toEmail || 'No recipient'}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-muted-foreground text-xs font-medium">Subject:</span>
          <span className="text-foreground text-sm font-medium">{subject || 'No subject'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="text-foreground text-sm leading-relaxed">
          {body ? (
            renderLines(body)
          ) : (
            <p className="text-muted-foreground italic">Email body will appear here...</p>
          )}
        </div>

        {signatureBody && (
          <>
            <div className="border-border my-3 border-t" />
            <div className="text-muted-foreground text-sm leading-relaxed">
              {renderLines(signatureBody)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailChecked, setGmailChecked] = useState(false);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string>('none');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const signatures = useSignatureStore((s) => s.signatures);
  const loadSignatures = useSignatureStore((s) => s.loadSignatures);

  const selectedSignature = signatures.find((s) => s.id === selectedSignatureId) ?? null;
  const contactKey = params ? (params.contact.email ?? params.contact.name) : '';

  // Check Gmail connection + load signatures on mount
  useEffect(() => {
    getGmailStatus().then((status) => {
      setGmailConnected(status.connected);
      setGmailChecked(true);
    });
    loadSignatures().then(() => {
      const defaultSig = useSignatureStore.getState().getDefault();
      if (defaultSig) setSelectedSignatureId(defaultSig.id);
    });
  }, [loadSignatures]);

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

  // Generate sequence when panel opens — restore from store if available
  useEffect(() => {
    if (!params || !open) return;

    setToEmail(params.contact.email ?? '');
    setActiveStep(0);

    const cached = useResearchStore
      .getState()
      .getEmailSequence(params.company.company_name, contactKey);

    if (cached) {
      setSteps(cached.emails);
      loadStep(0, cached.emails);
      return;
    }

    setSteps(null);
    const controller = new AbortController();
    setGenerating(true);
    generateEmailSequence(params.company, params.contact, params.icp, controller.signal)
      .then((sequence) => {
        setSteps(sequence.emails);
        loadStep(0, sequence.emails);
        useResearchStore
          .getState()
          .saveEmailSequence(params.company.company_name, contactKey, sequence);
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
      setSteps((prev) => {
        if (!prev) return prev;
        const updated = [...prev] as [GeneratedEmail, GeneratedEmail, GeneratedEmail];
        updated[activeStep] = { subject, body };
        const step = updated[newStep];
        setSubject(step.subject);
        setBody(step.body);
        setActiveStep(newStep);
        return updated;
      });
    },
    [activeStep, subject, body]
  );

  const handleRegenerate = useCallback(async () => {
    if (!params) return;
    setGenerating(true);
    try {
      const sequence = await generateEmailSequence(params.company, params.contact, params.icp);
      setSteps(sequence.emails);
      loadStep(activeStep, sequence.emails);
      useResearchStore
        .getState()
        .saveEmailSequence(params.company.company_name, contactKey, sequence);
    } catch {
      // keep current content
    } finally {
      setGenerating(false);
    }
  }, [params, activeStep, loadStep]);

  const handleSend = useCallback(async () => {
    if (!params || !toEmail) return;
    setSending(true);
    const sessionId = useResearchStore.getState().sessionId;
    const finalBody = selectedSignature ? `${body}\n\n${selectedSignature.body}` : body;
    try {
      const result = await sendEmailApi({
        to: toEmail,
        subject,
        body: finalBody,
        companyName: params.company.company_name,
        contactName: params.contact.name,
        ...(sessionId ? { sessionId } : {})
      });
      if (result.success) {
        toast.success('Email sent successfully');
      } else {
        toast.error(result.error ?? 'Send failed');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }, [params, toEmail, subject, body, selectedSignature]);

  // Persist edits to store + DB on close
  const handleClose = useCallback(() => {
    if (steps && params) {
      const updated = [...steps] as [GeneratedEmail, GeneratedEmail, GeneratedEmail];
      updated[activeStep] = { subject, body };
      useResearchStore
        .getState()
        .saveEmailSequence(params.company.company_name, contactKey, { emails: updated });
    }
    onClose();
  }, [steps, params, activeStep, subject, body, contactKey, onClose]);

  const company = params?.company;
  const contact = params?.contact;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent size="xl" className="flex h-[100dvh] flex-col gap-0 p-0 md:h-[680px]">
        <DialogHeader className="border-border shrink-0 border-b px-4 py-4 md:px-6">
          <div className="flex flex-col gap-2 pr-8 md:flex-row md:items-center md:justify-between">
            <div>
              <DialogTitle>{company?.company_name ?? ''}</DialogTitle>
              <DialogDescription>
                {contact ? `${contact.name} · ${contact.title}` : ''}
              </DialogDescription>
            </div>
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
          </div>
        </DialogHeader>

        {/* Two-column layout (single column on mobile) */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Left column — Editor */}
          <div
            className={`border-border flex w-full flex-col md:w-1/2 md:border-r ${showPreview ? 'hidden md:flex' : 'flex'}`}
          >
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 md:p-5">
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
                  className="min-h-40 flex-1 resize-none"
                  disabled={generating}
                  placeholder={generating ? 'Generating personalized email sequence...' : ''}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground text-xs font-medium">Signature</label>
                <Select value={selectedSignatureId} onValueChange={setSelectedSignatureId}>
                  <SelectTrigger className="bg-card text-xs">
                    <SelectValue placeholder="No signature" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No signature</SelectItem>
                    {signatures.map((sig) => (
                      <SelectItem key={sig.id} value={sig.id}>
                        {sig.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Footer actions */}
            <div className="border-border flex flex-wrap items-center gap-2 border-t px-4 py-3 md:px-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                className="md:hidden"
              >
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={generating}>
                {generating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                {generating ? 'Generating...' : 'Regenerate'}
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStepChange(activeStep - 1)}
                    disabled={activeStep === 0 || generating}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {activeStep + 1}/3
                  </span>
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
                  onClick={() => setConfirmOpen(true)}
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

                <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Send this email?</AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-2">
                          <div>
                            <span className="text-muted-foreground text-xs font-medium">To</span>
                            <p className="text-foreground text-sm">{toEmail}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs font-medium">
                              Subject
                            </span>
                            <p className="text-foreground text-sm">{subject}</p>
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        size="sm"
                        onClick={() => {
                          setConfirmOpen(false);
                          handleSend();
                        }}
                      >
                        <Send className="size-3.5" />
                        Send
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          {/* Right column — Live preview */}
          <div
            className={`flex min-h-0 w-full flex-col p-4 md:w-1/2 md:p-5 ${showPreview ? 'flex' : 'hidden md:flex'}`}
          >
            <div className="mb-2 flex shrink-0 items-center justify-between">
              <p className="text-muted-foreground text-xs font-medium">Preview</p>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-muted-foreground hover:text-foreground text-xs md:hidden"
              >
                Back to editor
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <EmailPreview
                toEmail={toEmail}
                subject={subject}
                body={body}
                signatureBody={selectedSignature?.body ?? null}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
