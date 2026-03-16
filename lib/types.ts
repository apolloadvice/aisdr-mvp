export interface ICPCriteria {
  description: string;
  industry_keywords: string[];
  min_funding_amount: number | null;
  funding_stages: string[];
  hiring_signals: string[];
  tech_keywords: string[];
  company_examples: string[];
}

export interface SourceLink {
  title: string;
  url: string;
}

export interface CompanySignal {
  type: 'job_posting' | 'news' | 'funding' | 'product_launch' | 'other';
  title: string;
  key_phrases: string[];
  source_url?: string;
}

export interface TargetContact {
  name: string;
  title: string;
  linkedin_url: string;
  email: string | null;
  is_decision_maker: boolean;
}

export interface CompanyResult {
  company_name: string;
  industry: string;
  funding_stage: string;
  amount_raised: string;
  website: string | null;
  linkedin_search_url: string;
  signals: CompanySignal[];
  match_reason: string;
  company_overview: string;
  contacts: TargetContact[];
  email_hook: string;
  /** Raw sources grouped by category for linking in the UI */
  sources: {
    jobs: SourceLink[];
    funding: SourceLink[];
    news: SourceLink[];
  };
}

export interface ResearchResponse {
  query: string;
  icp: ICPCriteria;
  results: CompanyResult[];
}

export interface ComposeEmailParams {
  company: CompanyResult;
  contact: TargetContact;
  initialBody: string;
}

export type ResearchStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'icp'; data: ICPCriteria }
  | { type: 'company'; data: CompanyResult }
  | { type: 'done'; total: number }
  | { type: 'error'; message: string };
