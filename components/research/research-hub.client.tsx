'use client';

import { useRouter } from 'next/navigation';
import { SessionsList } from './sessions-list.client';
import { ICPList } from './icp-list.client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { createSession } from '@/lib/api';
import type { ResearchSessionSummary, SavedICP } from '@/lib/types';

export function ResearchHub({
  sessions,
  icps
}: {
  sessions: ResearchSessionSummary[];
  icps: SavedICP[];
}) {
  const router = useRouter();

  const handleStartResearch = async () => {
    try {
      const session = await createSession();
      router.push(`/research/${session.id}`);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 pt-10 pb-24">
      <Tabs defaultValue="sessions">
        <TabsList className="mb-6">
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="icps">Saved Profiles</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <SessionsList sessions={sessions} />
        </TabsContent>
        <TabsContent value="icps">
          <ICPList icps={icps} onStartResearch={handleStartResearch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
