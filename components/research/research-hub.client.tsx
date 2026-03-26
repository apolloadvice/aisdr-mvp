'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createSession } from '@/lib/api';
import { SessionsList } from './sessions-list.client';
import { ICPList } from './icp-list.client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { ResearchSessionSummary, SavedICP } from '@/lib/types';
import { MAX_WIDTH } from '@/lib/layout';

export function ResearchHub({
  sessions,
  icps
}: {
  sessions: ResearchSessionSummary[];
  icps: SavedICP[];
}) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const session = await createSession();
      router.push(`/research/${session.id}`);
    } catch {
      toast.error('Failed to create session');
      setIsCreating(false);
    }
  };

  return (
    <div className={`mx-auto ${MAX_WIDTH} px-6 pt-10 pb-24`}>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Research</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {sessions.length} session{sessions.length === 1 ? '' : 's'} · {icps.length} saved
            profile{icps.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link
          href="/emails"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
        >
          <Mail className="size-3.5" />
          Sent Emails
        </Link>
      </div>

      <Tabs defaultValue="sessions">
        <div className="mb-4 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="icps">Saved Profiles</TabsTrigger>
          </TabsList>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            New Research
          </Button>
        </div>

        <TabsContent value="sessions">
          <SessionsList sessions={sessions} />
        </TabsContent>
        <TabsContent value="icps">
          <ICPList icps={icps} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
