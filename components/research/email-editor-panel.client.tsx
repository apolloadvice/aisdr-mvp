'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Send, RefreshCw } from 'lucide-react';
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
import type { ComposeEmailParams } from '@/lib/types';

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
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!params) return;
    setToEmail(params.contact.email ?? '');
    const signalTitle = params.company.signals[0]?.title ?? 'Introduction';
    setSubject(`${signalTitle} — ${params.company.company_name}`);
    setBody(params.initialBody);
    setCopied(false);
  }, [params]);

  const handleCopy = useCallback(() => {
    const text = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [subject, body]);

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
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="flex flex-1 flex-col space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">Body</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-52 flex-1 resize-none"
            />
          </div>
        </SheetBody>

        <SheetFooter className="flex-row border-t">
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="size-3.5" />
            Regenerate
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button size="sm" disabled title="Coming soon" className="ml-auto">
            <Send className="size-3.5" />
            Send
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
