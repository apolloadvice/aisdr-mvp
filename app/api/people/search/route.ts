import { NextRequest } from 'next/server';
import { apolloPeopleSearch } from '@/lib/services/apollo-people';
import { rankPeopleForCompany } from '@/lib/services/people-ranking';
import { peopleSearchBodySchema, parseBody } from '@/lib/validation';
import type { PeopleSearchResult } from '@/lib/types';

export async function POST(req: NextRequest) {
  const parsed = parseBody(peopleSearchBodySchema, await req.json());
  if (!parsed.success) return parsed.response;

  const { org_ids: orgIds, icp, companies } = parsed.data;

  if (!process.env.APOLLO_API_KEY) {
    return Response.json({ error: 'APOLLO_API_KEY is not set' }, { status: 500 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not set' }, { status: 500 });
  }

  try {
    const peopleByOrg = await apolloPeopleSearch(orgIds);

    const results: PeopleSearchResult[] = [];

    for (const company of companies) {
      const people = peopleByOrg.get(company.name) ?? [];

      if (people.length === 0) {
        results.push({
          company_name: company.name,
          apollo_org_id: company.apollo_org_id,
          ranked_people: [],
          all_people: []
        });
        continue;
      }

      const ranked = await rankPeopleForCompany(people, icp, company.name);

      results.push({
        company_name: company.name,
        apollo_org_id: company.apollo_org_id,
        ranked_people: ranked,
        all_people: people
      });
    }

    return Response.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'People search failed';
    console.error('[People Search]', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
