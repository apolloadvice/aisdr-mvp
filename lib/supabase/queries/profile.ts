import type { SupabaseClient } from '@supabase/supabase-js';

export function getProfile(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('user_profiles')
    .select('full_name, company_name')
    .eq('user_id', userId)
    .single();
}

export function upsertProfile(
  supabase: SupabaseClient,
  userId: string,
  fullName: string,
  companyName: string
) {
  return supabase.from('user_profiles').upsert(
    {
      user_id: userId,
      full_name: fullName,
      company_name: companyName,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id' }
  );
}
