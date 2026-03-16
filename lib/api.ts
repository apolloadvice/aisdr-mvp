import type { ICPCriteria, ResearchStreamEvent } from '@/lib/types';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function post<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = await response.json();
      if (data.error) message = data.error;
    } catch {
      // response wasn't JSON — use the status-based message
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export async function parseICP(input: string, signal?: AbortSignal): Promise<ICPCriteria> {
  const data = await post<{ icp: ICPCriteria }>('/api/parse-icp', { input }, signal);
  return data.icp;
}

export async function runResearch(
  icp: ICPCriteria,
  onEvent: (event: ResearchStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch('/api/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ icp }),
    signal
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = await response.json();
      if (data.error) message = data.error;
    } catch {
      // response wasn't JSON
    }
    throw new ApiError(message, response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response stream');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || '';

    for (const chunk of chunks) {
      if (!chunk.startsWith('data: ')) continue;
      try {
        const event: ResearchStreamEvent = JSON.parse(chunk.slice(6));
        if (event.type === 'error') {
          throw new Error(event.message);
        }
        onEvent(event);
      } catch (e) {
        // Re-throw intentional errors (from SSE error events), skip parse failures
        if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
      }
    }
  }
}
