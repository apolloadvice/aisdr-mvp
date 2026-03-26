'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Clock, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { deleteSession, updateSession } from '@/lib/api';
import { formatRelativeDate } from '@/lib/utils';
import { EditableName } from '@/components/shared/editable-name.client';
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
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleRename = async (id: string, name: string) => {
    try {
      await updateSession(id, { name });
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
    } catch {
      toast.error('Failed to rename session');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success('Session deleted');
    } catch {
      toast.error('Failed to delete session');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {sessions.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-muted-foreground text-sm">
            No sessions yet. Start your first research.
          </p>
        </Card>
      ) : (
        <Card className="!gap-0 !py-0">
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
                  {editingId === session.id ? (
                    <EditableName
                      value={session.name}
                      onSave={(name) => handleRename(session.id, name)}
                      onDone={() => setEditingId(null)}
                      initialEditing
                      inputClassName="h-7 text-sm font-medium"
                    />
                  ) : (
                    <span className="truncate text-sm font-medium">{session.name}</span>
                  )}
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
                <Button
                  variant="ghost"
                  size="icon-xs"
                  label="Rename session"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(session.id);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                </Button>
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
        </Card>
      )}
    </>
  );
}
