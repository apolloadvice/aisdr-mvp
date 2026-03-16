import type { ICPCriteria, CompanyResult, ResearchStreamEvent } from '@/lib/types';
import type { ICPParser, CompanyDiscovery, CompanyResearcher } from './interfaces';

/** Default service providers — swap these to change the pipeline */
import { claudeICPParser } from './ai';
import { parallelCompanyDiscovery } from './parallel';
import { claudeResearchAgent } from './research-agent';

export interface PipelineConfig {
  icpParser: ICPParser;
  companyDiscovery: CompanyDiscovery;
  companyResearcher: CompanyResearcher;
}

const defaultConfig: PipelineConfig = {
  icpParser: claudeICPParser,
  companyDiscovery: parallelCompanyDiscovery,
  companyResearcher: claudeResearchAgent
};

function buildLinkedInSearchUrl(name: string, companyName?: string): string {
  const keywords = companyName ? `${name} ${companyName}` : name;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}&origin=GLOBAL_SEARCH_HEADER`;
}

function filterRealContacts(
  contacts: { name: string; title: string; email: string | null; is_decision_maker: boolean }[],
  companyName: string
) {
  return contacts
    .filter((c) => {
      const name = c.name.trim();
      if (!name) return false;
      if (name.split(/\s+/).length < 2) return false;
      return !/^(VP|CTO|CEO|CFO|COO|Head|Director|Manager|Chief|President|SVP|EVP)\b/i.test(name);
    })
    .map((c) => ({
      name: c.name,
      title: c.title,
      linkedin_url: buildLinkedInSearchUrl(c.name, companyName),
      email: c.email || null,
      is_decision_maker: c.is_decision_maker
    }));
}

/**
 * Run the full research pipeline.
 * Accepts a send function to stream SSE events back to the client.
 * Providers are injectable — swap icpParser, companyDiscovery, or companyResearcher
 * without touching the orchestration logic.
 */
export async function runResearchPipeline(
  input: { transcript?: string; icp?: ICPCriteria },
  send: (event: ResearchStreamEvent) => void,
  config: PipelineConfig = defaultConfig
): Promise<void> {
  const { icpParser, companyDiscovery, companyResearcher } = config;

  // Step 1: Get ICP
  let icp: ICPCriteria;
  if (input.icp) {
    icp = input.icp;
    send({ type: 'icp', data: icp });
  } else if (input.transcript) {
    send({ type: 'status', message: 'Extracting ICP from transcript...' });
    icp = await icpParser.parse(input.transcript);
    send({ type: 'icp', data: icp });
  } else {
    throw new Error('Transcript or ICP is required');
  }

  // Step 2: Discover companies
  send({ type: 'status', message: `Searching for companies matching: ${icp.description}` });
  const companies = await companyDiscovery.find(icp);

  if (companies.length === 0) {
    send({ type: 'status', message: 'No companies found matching your criteria.' });
    send({ type: 'done', total: 0 });
    return;
  }

  const companyNames = companies.map((c) => c.name).join(', ');
  send({
    type: 'status',
    message: `Found ${companies.length} companies: ${companyNames}. Researching all in parallel...`
  });

  // Step 3: Research each company concurrently
  let completedCount = 0;

  const processCompany = async (company: (typeof companies)[number]) => {
    try {
      const research = await companyResearcher.research(company.name, icp, {
        description: company.description,
        website: company.website
      });

      const contacts = filterRealContacts(research.inferred_contacts, company.name);

      const result: CompanyResult = {
        company_name: company.name,
        industry: research.industry,
        funding_stage: research.funding_stage,
        amount_raised: research.amount_raised,
        website: company.website || null,
        linkedin_search_url: buildLinkedInSearchUrl(company.name),
        signals: research.signals,
        match_reason: research.match_reason,
        company_overview: research.company_overview,
        contacts,
        email_hook: research.email_hook,
        sources: research.sources
      };

      completedCount++;
      send({ type: 'company', data: result });
    } catch {
      send({ type: 'status', message: `Skipped ${company.name} due to an error.` });
    }
  };

  // Process sequentially to stay within rate limits
  for (const company of companies) {
    send({
      type: 'status',
      message: `Researching ${company.name} (${completedCount + 1}/${companies.length})...`
    });
    await processCompany(company);
  }
  send({ type: 'done', total: completedCount });
}
