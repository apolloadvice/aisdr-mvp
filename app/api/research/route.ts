import { NextRequest } from 'next/server';
import { parseQueryToICP, rankCompanies, generateCompanySummary } from '@/lib/services/ai';
import { findCompanies, researchCompany } from '@/lib/services/parallel';
import type { ResearchStreamEvent, CompanyResult, ICPCriteria } from '@/lib/types';

export const maxDuration = 300;

function buildLinkedInSearchUrl(name: string, companyName?: string): string {
  const keywords = companyName ? `${name} ${companyName}` : name;
  const q = encodeURIComponent(keywords);
  return `https://www.linkedin.com/search/results/people/?keywords=${q}&origin=GLOBAL_SEARCH_HEADER`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { transcript, icp: providedIcp } = body as {
    transcript?: string;
    icp?: ICPCriteria;
  };

  if (!transcript && !providedIcp) {
    return Response.json({ error: 'Transcript or ICP is required' }, { status: 400 });
  }

  const missing: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) missing.push('ANTHROPIC_API_KEY');
  if (!process.env.PARALLEL_API_KEY) missing.push('PARALLEL_API_KEY');

  if (missing.length > 0) {
    return Response.json(
      {
        error: `Missing required environment variables: ${missing.join(', ')}. Add them to .env.local`
      },
      { status: 500 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: ResearchStreamEvent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      try {
        // Step 1: Get ICP — either parse from transcript or use the provided one
        let icp: ICPCriteria;
        if (providedIcp) {
          icp = providedIcp;
          send({ type: 'icp', data: icp });
        } else {
          send({ type: 'status', message: 'Extracting ICP from transcript...' });
          icp = await parseQueryToICP(transcript!);
          send({ type: 'icp', data: icp });
        }

        // Step 2: Find companies
        send({
          type: 'status',
          message: `Searching for companies matching: ${icp.description}`
        });
        const allCompanies = await findCompanies(icp);

        if (allCompanies.length === 0) {
          send({ type: 'status', message: 'No companies found matching your criteria.' });
          send({ type: 'done', total: 0 });
          return;
        }

        // Step 3: Rank
        send({
          type: 'status',
          message: `Found ${allCompanies.length} candidates. Ranking by ICP fit...`
        });
        const topNames = await rankCompanies(allCompanies, icp, 3);
        const companies = allCompanies.filter((c) => topNames.includes(c.name));

        send({
          type: 'status',
          message: `Researching top ${companies.length} companies...`
        });

        // Step 4: Research concurrently
        let completedCount = 0;

        const processCompany = async (company: (typeof companies)[number]) => {
          try {
            const research = await researchCompany(company.name, icp, {
              description: company.description,
              match_reasoning: company.match_reasoning
            });

            const summary = await generateCompanySummary(
              {
                name: company.name,
                website: company.website,
                description: company.description,
                match_reasoning: company.match_reasoning,
                research_text: research.research_text
              },
              icp
            );

            const contacts = (summary.inferred_contacts || []).map((c) => ({
              name: c.name,
              title: c.title,
              linkedin_url: buildLinkedInSearchUrl(c.name, company.name),
              email: c.email || null,
              is_decision_maker: c.is_decision_maker
            }));

            const result: CompanyResult = {
              company_name: company.name,
              industry: summary.industry,
              funding_stage: summary.funding_stage,
              amount_raised: summary.amount_raised,
              website: company.website || null,
              linkedin_search_url: buildLinkedInSearchUrl(company.name),
              signals: summary.signals,
              match_reason: summary.match_reason,
              company_overview: summary.company_overview,
              contacts,
              email_hook: summary.email_hook
            };

            completedCount++;
            send({ type: 'company', data: result });
            send({
              type: 'status',
              message: `Researched ${completedCount}/${companies.length} companies...`
            });
          } catch (err) {
            console.error(`Error processing ${company.name}:`, err);
            send({
              type: 'status',
              message: `Skipped ${company.name} due to an error.`
            });
          }
        };

        await Promise.all(companies.map(processCompany));
        send({ type: 'done', total: completedCount });
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
