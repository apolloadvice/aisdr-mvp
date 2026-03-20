import { NextRequest } from 'next/server';
import { apolloPersonEnrich } from '@/lib/services/apollo-people';
import { peopleEnrichBodySchema, parseBody } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const parsed = parseBody(peopleEnrichBodySchema, await req.json());
  if (!parsed.success) return parsed.response;

  const { person_id: personId } = parsed.data;

  if (!process.env.APOLLO_API_KEY) {
    return Response.json({ error: 'APOLLO_API_KEY is not set' }, { status: 500 });
  }

  try {
    const person = await apolloPersonEnrich(personId);
    return Response.json({ person });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Person enrichment failed';
    console.error('[People Enrich]', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
