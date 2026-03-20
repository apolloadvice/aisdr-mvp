import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { signatureCreateBodySchema, parseBody } from '@/lib/validation';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('email_signatures')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ signatures: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = parseBody(signatureCreateBodySchema, await req.json());
  if (!parsed.success) return parsed.response;

  const { name, body: signatureBody } = parsed.data;

  const { data, error } = await supabase
    .from('email_signatures')
    .insert({ user_id: user.id, name, body: signatureBody })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
