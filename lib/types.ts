export interface ICPCriteria {
  description: string;
  industry_keywords: string[];
  min_employees: number | null;
  max_employees: number | null;
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
  linkedin_url: string;
  logo_url: string;
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

export interface ComposeEmailParams {
  company: CompanyResult;
  contact: TargetContact;
  initialBody: string;
}

export interface DiscoveredCompanyPreview {
  name: string;
  website?: string;
  description?: string;
  linkedin_url?: string;
  logo_url?: string;
  apollo_org_id?: string;
}

export interface ApolloPersonPreview {
  apollo_person_id: string;
  first_name: string;
  last_name_obfuscated: string;
  title: string | null;
  organization_name: string;
  has_email: boolean;
  has_direct_phone: boolean;
  last_name?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  is_enriched?: boolean;
}

export interface PeopleSearchResult {
  company_name: string;
  apollo_org_id: string;
  ranked_people: ApolloPersonPreview[];
}

export interface StrategyMessage {
  role: 'assistant' | 'user';
  content: string;
}

export type ResearchStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'icp'; data: ICPCriteria }
  | { type: 'candidates'; data: DiscoveredCompanyPreview[] }
  | { type: 'company'; data: CompanyResult }
  | { type: 'done'; total: number }
  | { type: 'error'; message: string };
