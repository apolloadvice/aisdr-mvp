import { NextRequest } from 'next/server';
import { claudeICPParser } from '@/lib/services/ai';
import { parseIcpBodySchema, parseBody } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const parsed = parseBody(parseIcpBodySchema, await req.json());
  if (!parsed.success) return parsed.response;

  const { input } = parsed.data;

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
