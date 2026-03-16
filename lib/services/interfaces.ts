import type { ICPCriteria, CompanyResult, SourceLink, CompanySignal } from '@/lib/types';

/**
 * Parses natural language input (transcript, query, notes) into structured ICP.
 * Current provider: Claude Haiku
 * Could be swapped for: GPT-4, local model, manual form
 */
export interface ICPParser {
  parse(input: string): Promise<ICPCriteria>;
}

/**
 * Discovers companies matching an ICP.
 * Current provider: Parallel FindAll
 * Could be swapped for: Crunchbase API, PitchBook, custom scraper, Apollo
 */
export interface CompanyDiscovery {
  find(icp: ICPCriteria): Promise<DiscoveredCompany[]>;
}

export interface DiscoveredCompany {
  name: string;
  website?: string;
  description?: string;
  /** Raw match reasoning or metadata from the discovery source */
  match_context: string;
}

/**
 * Deep-researches a single company: finds signals, contacts, and sources.
 * Current provider: Claude Sonnet + web search
 * Could be swapped for: multi-agent system, Parallel Task API, Perplexity, custom scraper
 */
export interface CompanyResearcher {
  research(
    companyName: string,
    icp: ICPCriteria,
    context?: { description?: string; website?: string }
  ): Promise<CompanyResearchResult>;
}

export interface CompanyResearchResult {
  signals: CompanySignal[];
  match_reason: string;
  company_overview: string;
  email_hook: string;
  industry: string;
  funding_stage: string;
  amount_raised: string;
  inferred_contacts: {
    name: string;
    title: string;
    email: string | null;
    is_decision_maker: boolean;
  }[];
  sources: {
    jobs: SourceLink[];
    funding: SourceLink[];
    news: SourceLink[];
  };
}
