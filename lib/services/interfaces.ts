import type { ICPCriteria, CompanySignal, SourceLink } from '@/lib/types';

/**
 * Parses natural language input (transcript, query, notes) into structured ICP.
 * Providers: Claude (ai.ts)
 */
export interface ICPParser {
  parse(input: string): Promise<ICPCriteria>;
}

/**
 * Discovers companies matching an ICP.
 * Providers: Apollo (apollo.ts), Parallel (parallel.ts)
 */
export interface CompanyDiscovery {
  find(icp: ICPCriteria, onProgress?: (message: string) => void): Promise<DiscoveredCompany[]>;
}

export interface DiscoveredCompany {
  name: string;
  website?: string;
  description?: string;
  linkedin_url?: string;
  logo_url?: string;
  apollo_org_id?: string;
  /** Raw match reasoning or metadata from the discovery source */
  match_context: string;
}

/**
 * Scores and ranks discovered companies against an ICP.
 * Providers: Claude (scoring.ts)
 */
export interface CompanyScorer {
  score(companies: DiscoveredCompany[], icp: ICPCriteria): Promise<DiscoveredCompany[]>;
}

/**
 * Deep-researches a single company: finds signals, contacts, and sources.
 * Providers: Claude + web search (research-agent.ts)
 */
export interface CompanyResearcher {
  research(
    companyName: string,
    icp: ICPCriteria,
    context?: { description?: string; website?: string },
    onProgress?: (message: string) => void
  ): Promise<CompanyResearchResult>;
}

export interface CompanyResearchResult {
  website: string | null;
  linkedin_url: string | null;
  signals: CompanySignal[];
  match_reason: string;
  company_overview: string;
  industry: string;
  funding_stage: string;
  amount_raised: string;
  sources: {
    jobs: SourceLink[];
    funding: SourceLink[];
    news: SourceLink[];
  };
}
