import { notFound } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase/server';
import { ResearchDashboard } from '@/components/research/research-dashboard.client';
import type { ResearchSession } from '@/lib/types';

export default async function ResearchSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthUser();

  if (!user) notFound();

  const { data, error } = await supabase
    .from('research_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) notFound();

  const session = data as ResearchSession;

  return <ResearchDashboard session={session} />;
}
