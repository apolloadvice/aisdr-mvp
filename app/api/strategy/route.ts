import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { serviceConfig } from '@/lib/services/config';
import { buildStrategyPrompt, buildStrategyRevisionPrompt } from '@/lib/prompts/strategy';
import { strategyBodySchema, parseBody } from '@/lib/validation';

function getContentBlockType(event: Anthropic.MessageStreamEvent): string | null {
  if (
    event.type === 'content_block_start' &&
    'content_block' in event &&
    typeof event.content_block === 'object' &&
    event.content_block !== null &&
    'type' in event.content_block
  ) {
    return String(event.content_block.type);
  }
  return null;
}

export async function POST(req: NextRequest) {
  const parsed = parseBody(strategyBodySchema, await req.json());
  if (!parsed.success) return parsed.response;

  const { icp, messages } = parsed.data;

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not set' }, { status: 500 });
  }

  const isRevision = messages && messages.length > 0;
  const systemPrompt = isRevision ? buildStrategyRevisionPrompt(icp) : buildStrategyPrompt(icp);

  const anthropicMessages: Anthropic.MessageParam[] = isRevision
    ? messages.map((m) => ({ role: m.role, content: m.content }))
    : [{ role: 'user', content: 'Analyze my ICP and present a research strategy.' }];

  try {
    const client = new Anthropic();

    const stream = await client.messages.stream({
      model: serviceConfig.fastModel,
      max_tokens: 4096,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5
        }
      ]
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          let searchInProgress = false;

          for await (const event of stream) {
            const blockType = getContentBlockType(event);
            if (blockType === 'web_search_tool_result') {
              searchInProgress = false;
            }
            if (blockType === 'tool_use') {
              searchInProgress = true;
              const chunk = `data: ${JSON.stringify({ type: 'status', message: 'Searching the web...' })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }

            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              if (searchInProgress) continue;
              const chunk = `data: ${JSON.stringify({ type: 'text', content: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Strategy generation failed';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Strategy generation failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
