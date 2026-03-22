import { getAuthUser } from '@/lib/supabase/server';
import { ResearchHub } from '@/components/research/research-hub.client';
import type { SavedICP } from '@/lib/types';

export default async function Research() {
  const { supabase, user } = await getAuthUser();

  if (!user) return <ResearchHub sessions={[]} icps={[]} />;

  const [sessionsRes, icpsRes] = await Promise.all([
    supabase
      .from('research_sessions')
      .select('id, name, step, status, icp, candidates, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('saved_icps')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
  ]);

  const sessions = (sessionsRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    step: row.step,
    status: row.status,
    icp_description: row.icp?.description ?? null,
    company_count: Array.isArray(row.candidates) ? row.candidates.length : 0,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));

  return <ResearchHub sessions={sessions} icps={(icpsRes.data ?? []) as SavedICP[]} />;
}
