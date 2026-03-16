import { NextRequest } from 'next/server';
import { claudeICPParser } from '@/lib/services/ai';

export async function POST(req: NextRequest) {
  const body: Record<string, unknown> = await req.json();
  const input = typeof body.input === 'string' ? body.input : undefined;

  if (!input?.trim()) {
    return Response.json({ error: 'Input is required' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not set' }, { status: 500 });
  }

  try {
    const icp = await claudeICPParser.parse(input.trim());
    return Response.json({ icp });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to parse ICP';
    return Response.json({ error: message }, { status: 500 });
  }
}
