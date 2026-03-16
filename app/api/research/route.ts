import { NextRequest } from 'next/server';
import { runResearchPipeline } from '@/lib/services/pipeline';
import type { ResearchStreamEvent, ICPCriteria } from '@/lib/types';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body: Record<string, unknown> = await req.json();
  const transcript = typeof body.transcript === 'string' ? body.transcript : undefined;
  const icp = body.icp && typeof body.icp === 'object' ? (body.icp as ICPCriteria) : undefined;

  if (!transcript && !icp) {
    return Response.json({ error: 'Transcript or ICP is required' }, { status: 400 });
  }

  const missing: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) missing.push('ANTHROPIC_API_KEY');
  if (!process.env.PARALLEL_API_KEY) missing.push('PARALLEL_API_KEY');

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
        await runResearchPipeline({ transcript, icp }, send);
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
