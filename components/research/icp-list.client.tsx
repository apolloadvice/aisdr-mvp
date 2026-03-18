'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Pencil,
  Check,
  X,
  Plus,
  Loader2,
  ArrowRight,
  FileText,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { IcpPanelEditable } from './icp-panel-editable';
import { createSession, deleteICP, updateICP, createICP, parseICP } from '@/lib/api';
import { formatRelativeDate } from '@/lib/utils';
import { EXAMPLE_CUSTOMER_INPUT } from '@/lib/constants';
import type { SavedICP, ICPCriteria } from '@/lib/types';

function ICPRow({
  icp,
  onDelete,
  onRename,
  onUse,
  isDeleting,
  isUsing
}: {
  icp: SavedICP;
  onDelete: () => void;
  onRename: (name: string) => void;
  onUse: () => void;
  isDeleting: boolean;
  isUsing: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(icp.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleSave = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== icp.name) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  const tags = [
    ...icp.icp.industry_keywords,
    ...icp.icp.tech_keywords.slice(0, 2),
    ...icp.icp.hiring_signals.slice(0, 1)
  ].slice(0, 5);

  return (
    <div className="border-border flex items-center gap-4 border-b px-5 py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {editing ? (
            <div className="flex items-center gap-1">
              <Input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') {
                    setDraft(icp.name);
                    setEditing(false);
                  }
                }}
                className="h-7 w-56 text-sm"
              />
              <Button
                size="icon-xs"
                label="Save name"
                onClick={handleSave}
                disabled={!draft.trim()}
              >
                <Check className="size-3" />
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                label="Cancel"
                onClick={() => {
                  setDraft(icp.name);
                  setEditing(false);
                }}
              >
                <X className="size-3" />
              </Button>
            </div>
          ) : (
            <span className="truncate text-sm font-medium">{icp.name}</span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">{icp.icp.description}</p>
        {tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-muted text-muted-foreground"
                style={{
                  borderRadius: 'var(--tag-radius, 9999px)',
                  paddingInline: 'var(--tag-padding-x, 0.5rem)',
                  paddingBlock: 'var(--tag-padding-y, 0.125rem)',
                  fontSize: 'var(--tag-font-size, 0.75rem)'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <span className="text-muted-foreground mt-1 block text-xs">
          {formatRelativeDate(icp.updated_at)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          label="Rename"
          onClick={() => setEditing(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              label="Delete"
              disabled={isDeleting}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this saved profile?</AlertDialogTitle>
              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          size="xs"
          variant="outline"
          onClick={onUse}
          disabled={isUsing}
          title="Create a new session with this profile"
        >
          {isUsing ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <ArrowRight className="size-3" />
          )}
          Start Research
        </Button>
      </div>
    </div>
  );
}

function CreateICPModal({
  open,
  onOpenChange,
  onCreated
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (icp: SavedICP) => void;
}) {
  const [formStep, setFormStep] = useState<'describe' | 'review'>('describe');
  const [description, setDescription] = useState('');
  const [icp, setIcp] = useState<ICPCriteria | null>(null);
  const [name, setName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setFormStep('describe');
      setDescription('');
      setIcp(null);
      setName('');
      setError(null);
    }
  }, [open]);

  const handleExtract = async () => {
    if (!description.trim()) return;
    setIsExtracting(true);
    setError(null);
    try {
      const parsed = await parseICP(description.trim());
      setIcp({ ...parsed, description: description.trim() });
      setName(description.trim().slice(0, 40));
      setFormStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!icp || !name.trim()) return;
    setIsSaving(true);
    try {
      const saved = await createICP(name.trim(), icp);
      onCreated(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setIsSaving(false);
    }
  };

  const updateIcpField = <K extends keyof ICPCriteria>(field: K, value: ICPCriteria[K]) => {
    if (icp) setIcp({ ...icp, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" showCloseButton={false} className="gap-0 p-0">
        <DialogTitle className="sr-only">New Customer Profile</DialogTitle>
        {formStep === 'describe' && (
          <>
            <div className="p-6 pb-0">
              <h2 className="text-lg font-semibold tracking-tight">Describe your customer</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                The more details you provide, the better the profile. Include who you sell to, what
                signals matter, and any example companies.
              </p>
            </div>

            {error && <p className="text-destructive px-6 pt-3 text-sm">{error}</p>}

            <div className="p-6">
              <div className="border-border bg-card overflow-hidden rounded-[var(--card-radius)] border">
                <div className="bg-muted/50 border-border flex items-center justify-between border-b px-4 py-2.5">
                  <span className="text-muted-foreground section-label">Customer Profile</span>
                  {description.trim() && (
                    <span className="text-muted-foreground/60 text-xs">
                      <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
                        Cmd+Enter
                      </kbd>{' '}
                      to continue
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <Textarea
                    placeholder="Who is your ideal customer? Describe the industries, company size, job titles, technologies, buying signals, or anything else that defines a good fit..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-52 resize-y border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
                    disabled={isExtracting}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleExtract();
                      }
                    }}
                  />
                </div>

                <div className="border-border flex items-center gap-2 border-t px-4 py-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDescription(EXAMPLE_CUSTOMER_INPUT)}
                    className="text-muted-foreground"
                  >
                    <FileText className="size-3.5" />
                    Try an example
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-border flex items-center justify-end border-t px-6 py-4">
              <Button
                size="sm"
                onClick={handleExtract}
                disabled={isExtracting || !description.trim()}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze
                    <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {formStep === 'review' && icp && (
          <>
            <div className="p-6 pb-0">
              <h2 className="text-lg font-semibold tracking-tight">Review & save profile</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Edit the extracted profile below, then save it.
              </p>
            </div>

            {error && <p className="text-destructive px-6 pt-3 text-sm">{error}</p>}

            <div className="p-6">
              <div className="mb-4">
                <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                  Profile name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                  }}
                  autoFocus
                  className="text-sm"
                />
              </div>

              <IcpPanelEditable icp={icp} onUpdate={updateIcpField} />
            </div>

            <div className="border-border flex items-center justify-between border-t px-6 py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFormStep('describe');
                  setError(null);
                }}
              >
                Back
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving || !name.trim()}>
                {isSaving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ICPList({
  icps: initialICPs,
  onStartResearch
}: {
  icps: SavedICP[];
  onStartResearch: () => void;
}) {
  const router = useRouter();
  const [icps, setICPs] = useState(initialICPs);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [usingId, setUsingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteICP(id);
      setICPs((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error('Failed to delete ICP:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRename = async (id: string, newName: string) => {
    try {
      const updated = await updateICP(id, { name: newName });
      setICPs((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      console.error('Failed to rename ICP:', err);
    }
  };

  const handleUse = async (icp: SavedICP) => {
    setUsingId(icp.id);
    try {
      const session = await createSession({
        name: icp.name,
        transcript: icp.icp.description,
        icp: icp.icp,
        step: 'review'
      });
      router.push(`/research/${session.id}`);
    } catch (err) {
      console.error('Failed to create session from ICP:', err);
      setUsingId(null);
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Saved customer profiles. Use one to start a new research session.
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" />
          New Profile
        </Button>
      </div>

      <CreateICPModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={(saved) => {
          setICPs((prev) => [saved, ...prev]);
          setShowCreate(false);
        }}
      />

      {icps.length === 0 ? (
        <div className="border-border bg-card rounded-[var(--card-radius)] border py-16 text-center">
          <p className="text-muted-foreground text-sm">
            No saved profiles yet. Create one above or save from the strategy step during research.
          </p>
        </div>
      ) : (
        <div className="border-border bg-card overflow-hidden rounded-[var(--card-radius)] border">
          {icps.map((icp) => (
            <ICPRow
              key={icp.id}
              icp={icp}
              onDelete={() => handleDelete(icp.id)}
              onRename={(newName) => handleRename(icp.id, newName)}
              onUse={() => handleUse(icp)}
              isDeleting={deletingId === icp.id}
              isUsing={usingId === icp.id}
            />
          ))}
        </div>
      )}
    </>
  );
}
