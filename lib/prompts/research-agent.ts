import type { ICPCriteria } from '@/lib/types';

export function buildResearchAgentPrompt(
  companyName: string,
  icp: ICPCriteria,
  context?: { description?: string; website?: string }
): string {
  const contextLine = context?.description ? `Context: ${context.description}` : '';
  const signals = icp.hiring_signals.slice(0, 3).join(', ');

  return `Research "${companyName}" for outbound sales. ${contextLine}

ICP: ${icp.description}
Signals to find: ${signals}
Tech: ${icp.tech_keywords.slice(0, 3).join(', ')}

You have 2 web searches. Use them wisely:
- Search 1: "${companyName} funding raised series investors" — gets funding + company overview
- Search 2: "${companyName} jobs hiring ${icp.hiring_signals[0] || 'engineering'} news" — gets jobs + recent news

Return ONLY JSON:
{"signals":[{"type":"job_posting"|"news"|"funding"|"product_launch"|"other","title":"description","key_phrases":["phrases"],"source_url":"real URL from search or null"}],"match_reason":"one sentence with concrete fact","company_overview":"2-3 sentences: what they do, stage, why they fit ICP","email_hook":"one cold email opener referencing a specific signal","industry":"industry","funding_stage":"stage or Unknown","amount_raised":"e.g. $150M Series C or Unknown","inferred_contacts":[{"name":"real full name only","title":"title","email":"inferred or null","is_decision_maker":true}],"sources":{"jobs":[{"title":"title","url":"URL"}],"funding":[{"title":"title","url":"URL"}],"news":[{"title":"title","url":"URL"}]}}

Rules: Only use URLs from search results (null if not found). Only real full names for contacts (no placeholders). Infer emails from domain pattern.`;
}
