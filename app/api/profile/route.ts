import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { profileUpdateBodySchema, parseBody } from '@/lib/validation';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .single();

  return Response.json({ full_name: data?.full_name ?? '' });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = parseBody(profileUpdateBodySchema, await req.json());
  if (!parsed.success) return parsed.response;

  const fullName = parsed.data.full_name.trim();

  const { error } = await supabase.from('user_profiles').upsert(
    { user_id: user.id, full_name: fullName, updated_at: new Date().toISOString() },
    {
      onConflict: 'user_id'
    }
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ full_name: fullName });
}
