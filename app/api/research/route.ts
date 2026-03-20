import { NextRequest } from 'next/server';
import { discoverCompanies, researchConfirmedCompanies } from '@/lib/services/pipeline';
import { researchBodySchema, parseBody } from '@/lib/validation';
import type { ResearchStreamEvent } from '@/lib/types';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const parsed = parseBody(researchBodySchema, await req.json());
  if (!parsed.success) return parsed.response;

  const { icp, companies, candidates } = parsed.data;

  const missing: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) missing.push('ANTHROPIC_API_KEY');
  if (!process.env.APOLLO_API_KEY && !companies) missing.push('APOLLO_API_KEY');

  if (missing.length > 0) {
    return Response.json(
      { error: `Missing environment variables: ${missing.join(', ')}. Add them to .env.local` },
      { status: 500 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ResearchStreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        if (companies) {
          await researchConfirmedCompanies(companies, icp, send, undefined, candidates);
        } else {
          await discoverCompanies(icp, send);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        send({ type: 'error', message });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
}
