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
  icp: ICPCriteria;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export interface GeneratedEmailSequence {
  emails: [GeneratedEmail, GeneratedEmail, GeneratedEmail];
}

export interface SentEmail {
  id: string;
  user_id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body: string;
  company_name: string;
  contact_name: string;
  status: 'sent' | 'failed';
  error_message: string | null;
  gmail_message_id: string | null;
  session_id: string | null;
  created_at: string;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  companyName: string;
  contactName: string;
  sessionId?: string;
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
  all_people: ApolloPersonPreview[];
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

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export interface SavedICP {
  id: string;
  user_id: string;
  name: string;
  icp: ICPCriteria;
  created_at: string;
  updated_at: string;
}

export interface ResearchSession {
  id: string;
  user_id: string;
  name: string;
  step: string;
  transcript: string;
  icp: ICPCriteria | null;
  strategy_messages: StrategyMessage[];
  candidates: DiscoveredCompanyPreview[];
  selected_companies: string[];
  results: CompanyResult[];
  people_results: Record<string, ApolloPersonPreview[]>;
  email_sequences: Record<string, GeneratedEmailSequence>;
  status: 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface ResearchSessionSummary {
  id: string;
  name: string;
  step: string;
  status: 'in_progress' | 'completed';
  icp_description: string | null;
  company_count: number;
  created_at: string;
  updated_at: string;
}

export interface EmailSignature {
  id: string;
  user_id: string;
  name: string;
  body: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactedCompany {
  id: string;
  user_id: string;
  company_name: string;
  contact_email: string;
  contact_name: string;
  session_id: string | null;
  sent_email_id: string | null;
  created_at: string;
}
