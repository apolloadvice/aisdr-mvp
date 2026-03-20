import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createIcpBodySchema, parseBody } from '@/lib/validation';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('saved_icps')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ icps: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = parseBody(createIcpBodySchema, await req.json());
  if (!parsed.success) return parsed.response;

  const { name, icp } = parsed.data;

  const { data, error } = await supabase
    .from('saved_icps')
    .insert({ user_id: user.id, name, icp })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
