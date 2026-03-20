'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { EmailEditorInline } from './email-editor-inline.client';
import type { ComposeEmailParams } from '@/lib/types';

export function EmailEditorDialog({
  open,
  params,
  onClose
}: {
  open: boolean;
  params: ComposeEmailParams | null;
  onClose: () => void;
}) {
  if (!params) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent size="xl" className="flex h-[100dvh] flex-col gap-0 p-0 md:h-[680px]">
        <DialogHeader className="sr-only">
          <DialogTitle>{params.company.company_name}</DialogTitle>
          <DialogDescription>
            {params.contact.name} &middot; {params.contact.title}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1">
          <EmailEditorInline
            key={params.contact.email ?? params.contact.name}
            params={params}
            onSent={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
