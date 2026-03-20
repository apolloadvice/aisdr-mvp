import { serviceConfig } from './config';
import type { ApolloPersonPreview } from '@/lib/types';

interface ApolloPersonResult {
  id: string;
  first_name: string;
  last_name_obfuscated: string;
  title: string | null;
  has_email: boolean;
  has_direct_phone: string; // "Yes" or "No"
  organization?: {
    name: string;
  };
}

interface ApolloPeopleSearchResponse {
  people: ApolloPersonResult[];
  total_entries: number;
}

interface ApolloPersonMatchResponse {
  person: {
    id: string;
    first_name: string;
    last_name: string;
    title: string | null;
    email: string | null;
    linkedin_url: string | null;
    contact?: {
      phone_numbers?: { raw_number: string }[];
    };
  };
}

function isApolloPeopleSearchResponse(value: unknown): value is ApolloPeopleSearchResponse {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return Array.isArray(obj.people);
}

function isApolloPersonMatchResponse(value: unknown): value is ApolloPersonMatchResponse {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.person === 'object' && obj.person !== null;
}

/**
 * Search for people at given organizations via Apollo mixed_people search.
 * Groups results by organization name.
 */
export async function apolloPeopleSearch(
  orgIds: string[]
): Promise<Map<string, ApolloPersonPreview[]>> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) throw new Error('APOLLO_API_KEY is not set');

  const payload = {
    organization_ids: orgIds,
    per_page: 25,
    page: 1
  };

  const response = await fetch(`${serviceConfig.apolloBaseUrl}/mixed_people/api_search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'x-api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Apollo People API error (${response.status}): ${responseText}`);
  }

  let data: unknown;
  try {
    // Apollo sometimes returns trailing content after the JSON object.
    // Extract the first complete JSON object to handle this safely.
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found');
    }
    data = JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    throw new Error(
      `Apollo People API returned invalid JSON (status ${response.status}): ${responseText.slice(0, 200)}`
    );
  }
  if (!isApolloPeopleSearchResponse(data)) {
    throw new Error('Unexpected Apollo People response shape');
  }

  const grouped = new Map<string, ApolloPersonPreview[]>();

  for (const person of data.people) {
    const orgName = person.organization?.name ?? 'Unknown';

    const preview: ApolloPersonPreview = {
      apollo_person_id: person.id,
      first_name: person.first_name,
      last_name_obfuscated: person.last_name_obfuscated,
      title: person.title,
      organization_name: orgName,
      has_email: person.has_email === true,
      has_direct_phone: person.has_direct_phone === 'Yes'
    };

    const existing = grouped.get(orgName) ?? [];
    existing.push(preview);
    grouped.set(orgName, existing);
  }

  return grouped;
}

/**
 * Enrich a single person via Apollo people/match endpoint (1 credit).
 * Returns full contact details.
 */
export async function apolloPersonEnrich(personId: string): Promise<{
  first_name: string;
  last_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
}> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) throw new Error('APOLLO_API_KEY is not set');

  const response = await fetch(`${serviceConfig.apolloBaseUrl}/people/match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      id: personId,
      reveal_personal_emails: true
    })
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Apollo People Match API error (${response.status}): ${responseText}`);
  }

  let data: unknown;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found');
    data = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(
      `Apollo People Match API returned invalid JSON (status ${response.status}): ${responseText.slice(0, 200)}`
    );
  }
  if (!isApolloPersonMatchResponse(data)) {
    throw new Error('Unexpected Apollo People Match response shape');
  }

  const p = data.person;
  return {
    first_name: p.first_name,
    last_name: p.last_name,
    title: p.title,
    email: p.email,
    phone: p.contact?.phone_numbers?.[0]?.raw_number ?? null,
    linkedin_url: p.linkedin_url
  };
}
