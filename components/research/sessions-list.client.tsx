'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { createSession, deleteSession } from '@/lib/api';
import { formatRelativeDate } from '@/lib/utils';
import type { ResearchSessionSummary } from '@/lib/types';

const STEP_LABELS: Record<string, string> = {
  input: 'Describe Customer',
  review: 'Strategy Review',
  confirm: 'Select Companies',
  results: 'Research Results'
};

export function SessionsList({
  sessions: initialSessions
}: {
  sessions: ResearchSessionSummary[];
}) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const session = await createSession();
      router.push(`/research/${session.id}`);
    } catch (err) {
      console.error('Failed to create session:', err);
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete session:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Resume a previous session or start a new one.
        </p>
        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          New Research
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="border-border bg-card rounded-(--card-radius) border py-16 text-center">
          <p className="text-muted-foreground text-sm">
            No sessions yet. Start your first research.
          </p>
          <Button onClick={handleCreate} disabled={isCreating} className="mt-4" variant="outline">
            {isCreating ? <Loader2 className="size-4 animate-spin" /> : null}
            Start Research
          </Button>
        </div>
      ) : (
        <div className="border-border bg-card overflow-hidden rounded-(--card-radius) border">
          {sessions.map((session, i) => (
            <div
              key={session.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/research/${session.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(`/research/${session.id}`);
                }
              }}
              className={`border-border hover:bg-muted/50 flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors ${i < sessions.length - 1 ? 'border-b' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{session.name}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      session.status === 'completed'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {session.status === 'completed'
                      ? 'Completed'
                      : STEP_LABELS[session.step] || session.step}
                  </span>
                </div>
                <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                  {session.icp_description && (
                    <span className="truncate">{session.icp_description}</span>
                  )}
                  {session.company_count > 0 && (
                    <span className="shrink-0">{session.company_count} companies</span>
                  )}
                  <span className="flex shrink-0 items-center gap-1">
                    <Clock className="size-3" />
                    {formatRelativeDate(session.updated_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      label="Delete session"
                      onClick={(e) => e.stopPropagation()}
                      disabled={deletingId === session.id}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this session?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(session.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
