import type {
  ICPCriteria,
  DiscoveredCompanyPreview,
  ResearchStreamEvent,
  PeopleSearchResult,
  StrategyMessage
} from '@/lib/types';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Shared: POST JSON and throw on error */
async function postJson(url: string, body: unknown, signal?: AbortSignal): Promise<Response> {
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
    } catch {}
    throw new ApiError(message, response.status);
  }

  return response;
}

/** Shared: read an SSE stream, calling onEvent for each parsed `data:` line */
async function readSSEStream<T>(response: Response, onEvent: (event: T) => void): Promise<void> {
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
        const event = JSON.parse(chunk.slice(6)) as T;
        onEvent(event);
      } catch (e) {
        if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Strategy streaming
// ---------------------------------------------------------------------------

interface StrategyCallbacks {
  onChunk: (text: string) => void;
  onStatus?: (message: string) => void;
  onIcpUpdate?: (updates: Partial<ICPCriteria>) => void;
}

type StrategyEvent =
  | { type: 'text'; content: string }
  | { type: 'status'; message: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

/** Extract and strip <icp_update> block from text */
function extractIcpUpdate(text: string): {
  cleanText: string;
  updates: Partial<ICPCriteria> | null;
} {
  const match = text.match(
    /<icp_update>\s*(?:```(?:json)?\s*)?([\s\S]*?)(?:\s*```)?\s*<\/icp_update>/
  );
  if (!match) return { cleanText: text, updates: null };

  try {
    const parsed: unknown = JSON.parse(match[1].trim());
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { cleanText: text, updates: null };
    }
    const cleanText = text.replace(/<icp_update>[\s\S]*?<\/icp_update>/g, '').trimEnd();
    return { cleanText, updates: parsed as Partial<ICPCriteria> };
  } catch {
    return { cleanText: text, updates: null };
  }
}

/** Strip icp_update blocks (complete or partial) for display during streaming */
function stripIcpUpdateForDisplay(text: string): string {
  return text
    .replace(/<icp_update>[\s\S]*?<\/icp_update>/g, '')
    .replace(/<icp_update>[\s\S]*$/g, '')
    .trimEnd();
}

/** Stream strategy analysis from the AI agent */
export async function streamStrategy(
  icp: ICPCriteria,
  messages: StrategyMessage[],
  callbacks: StrategyCallbacks,
  signal?: AbortSignal
): Promise<string> {
  const response = await postJson(
    '/api/strategy',
    { icp, messages: messages.length > 0 ? messages : undefined },
    signal
  );

  let fullText = '';

  await readSSEStream<StrategyEvent>(response, (event) => {
    if (event.type === 'text') {
      fullText += event.content;
      callbacks.onChunk(stripIcpUpdateForDisplay(fullText));
    } else if (event.type === 'status') {
      callbacks.onStatus?.(event.message);
    } else if (event.type === 'error') {
      throw new Error(event.message);
    }
  });

  const { cleanText, updates } = extractIcpUpdate(fullText);
  if (updates) {
    callbacks.onIcpUpdate?.(updates);
  }

  return cleanText;
}

// ---------------------------------------------------------------------------
// Research pipeline
// ---------------------------------------------------------------------------

export async function parseICP(input: string, signal?: AbortSignal): Promise<ICPCriteria> {
  const response = await postJson('/api/parse-icp', { input }, signal);
  const data = (await response.json()) as { icp: ICPCriteria };
  return data.icp;
}

/** Phase 1: Discover candidate companies for an ICP */
export async function discoverCompanies(
  icp: ICPCriteria,
  onEvent: (event: ResearchStreamEvent) => void,
  signal?: AbortSignal
): Promise<DiscoveredCompanyPreview[]> {
  const response = await postJson('/api/research', { icp }, signal);
  let candidates: DiscoveredCompanyPreview[] = [];

  await readSSEStream<ResearchStreamEvent>(response, (event) => {
    if (event.type === 'error') throw new Error(event.message);
    if (event.type === 'candidates') candidates = event.data;
    onEvent(event);
  });

  return candidates;
}

/** Phase 2: Research confirmed companies */
export async function researchCompanies(
  icp: ICPCriteria,
  companies: string[],
  onEvent: (event: ResearchStreamEvent) => void,
  signal?: AbortSignal,
  candidates?: DiscoveredCompanyPreview[]
): Promise<void> {
  const response = await postJson('/api/research', { icp, companies, candidates }, signal);

  await readSSEStream<ResearchStreamEvent>(response, (event) => {
    if (event.type === 'error') throw new Error(event.message);
    onEvent(event);
  });
}

/** Search for people at companies via Apollo */
export async function searchPeople(
  orgIds: string[],
  icp: ICPCriteria,
  companies: { name: string; apollo_org_id: string }[],
  signal?: AbortSignal
): Promise<PeopleSearchResult[]> {
  const response = await postJson(
    '/api/people/search',
    { org_ids: orgIds, icp, companies },
    signal
  );
  const data = (await response.json()) as { results: PeopleSearchResult[] };
  return data.results;
}

/** Enrich a single person via Apollo (1 credit) */
export async function enrichPerson(
  personId: string,
  signal?: AbortSignal
): Promise<{
  first_name: string;
  last_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
}> {
  const response = await postJson('/api/people/enrich', { person_id: personId }, signal);
  const data = (await response.json()) as {
    person: {
      first_name: string;
      last_name: string;
      title: string | null;
      email: string | null;
      phone: string | null;
      linkedin_url: string | null;
    };
  };
  return data.person;
}
