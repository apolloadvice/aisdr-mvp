import type {
  ICPCriteria,
  CompanyResult,
  ResearchStreamEvent,
  DiscoveredCompanyPreview
} from '@/lib/types';
import type { ICPParser, CompanyDiscovery, CompanyScorer, CompanyResearcher } from './interfaces';

import { claudeICPParser } from './ai';
import { apolloCompanyDiscovery } from './apollo';
import { claudeCompanyScorer } from './scoring';
import { claudeResearchAgent } from './research-agent';

export interface PipelineConfig {
  icpParser: ICPParser;
  companyDiscovery: CompanyDiscovery;
  companyScorer: CompanyScorer;
  companyResearcher: CompanyResearcher;
}

const defaultConfig: PipelineConfig = {
  icpParser: claudeICPParser,
  companyDiscovery: apolloCompanyDiscovery,
  companyScorer: claudeCompanyScorer,
  companyResearcher: claudeResearchAgent
};

function buildLinkedInCompanySearchUrl(companyName: string): string {
  return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyName)}`;
}

function buildLogoUrl(website: string | null, companyName: string): string {
  const domain =
    website?.replace(/^https?:\/\//, '').replace(/\/.*$/, '') ||
    `${companyName.toLowerCase().replace(/\s+/g, '')}.com`;
  return `https://logo.clearbit.com/${domain}`;
}

/**
 * Phase 1: Discover companies matching the ICP.
 * Apollo search → Claude scoring → ranked candidates for user confirmation.
 */
export async function discoverCompanies(
  icp: ICPCriteria,
  send: (event: ResearchStreamEvent) => void,
  config: PipelineConfig = defaultConfig
): Promise<void> {
  send({ type: 'status', message: `Searching for companies matching: ${icp.description}` });

  const companies = await config.companyDiscovery.find(icp, (message) => {
    send({ type: 'status', message });
  });

  if (companies.length === 0) {
    send({ type: 'status', message: 'No companies found matching your criteria.' });
    send({ type: 'candidates', data: [] });
    return;
  }

  send({ type: 'status', message: `Scoring ${companies.length} companies against your ICP...` });
  const scored = await config.companyScorer.score(companies, icp);

  const candidates: DiscoveredCompanyPreview[] = scored.map((c) => ({
    name: c.name,
    website: c.website,
    description: c.description,
    linkedin_url: c.linkedin_url,
    logo_url: c.logo_url,
    apollo_org_id: c.apollo_org_id
  }));

  send({ type: 'candidates', data: candidates });
}

/**
 * Phase 2: Deep-research confirmed companies.
 * Takes company names the user approved, plus candidate previews
 * for pre-fetched metadata (logo, linkedin, website from discovery).
 */
export async function researchConfirmedCompanies(
  companyNames: string[],
  icp: ICPCriteria,
  send: (event: ResearchStreamEvent) => void,
  config: PipelineConfig = defaultConfig,
  candidateData?: DiscoveredCompanyPreview[]
): Promise<void> {
  let completedCount = 0;

  const candidateMap = new Map<string, DiscoveredCompanyPreview>();
  if (candidateData) {
    for (const c of candidateData) {
      candidateMap.set(c.name, c);
    }
  }

  const COMPANY_TIMEOUT_MS = 90_000; // 90s per company

  const processCompany = async (companyName: string, index: number) => {
    send({
      type: 'status',
      message: `Researching ${companyName} (${index + 1}/${companyNames.length})...`
    });

    try {
      const candidate = candidateMap.get(companyName);

      const researchPromise = config.companyResearcher.research(
        companyName,
        icp,
        {
          description: candidate?.description,
          website: candidate?.website
        },
        (message) => send({ type: 'status', message: `Researching ${companyName}: ${message}` })
      );

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), COMPANY_TIMEOUT_MS)
      );

      const research = await Promise.race([researchPromise, timeoutPromise]);

      // Prefer discovery-provided URLs, fall back to research results
      const websiteUrl = candidate?.website || research.website || null;
      const linkedinUrl =
        candidate?.linkedin_url ||
        research.linkedin_url ||
        buildLinkedInCompanySearchUrl(companyName);
      const logoUrl = candidate?.logo_url || buildLogoUrl(websiteUrl, companyName);

      const result: CompanyResult = {
        company_name: companyName,
        industry: research.industry,
        funding_stage: research.funding_stage,
        amount_raised: research.amount_raised,
        website: websiteUrl,
        linkedin_url: linkedinUrl,
        logo_url: logoUrl,
        signals: research.signals,
        match_reason: research.match_reason,
        company_overview: research.company_overview,
        sources: research.sources
      };

      completedCount++;
      send({ type: 'company', data: result });
    } catch {
      send({ type: 'status', message: `Skipped ${companyName} due to an error.` });
    }
  };

  // Process companies in parallel batches of 3
  const BATCH_SIZE = 3;
  for (let i = 0; i < companyNames.length; i += BATCH_SIZE) {
    const batch = companyNames.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((name, j) => processCompany(name, i + j)));
  }
  send({ type: 'done', total: completedCount });
}
