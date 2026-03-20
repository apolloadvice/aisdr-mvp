import type { ICPCriteria } from '@/lib/types';

export function buildResearchAgentPrompt(
  companyName: string,
  icp: ICPCriteria,
  context?: { description?: string; website?: string }
): string {
  const contextLine = context?.description ? ` Context: ${context.description}` : '';
  const signals = icp.hiring_signals.slice(0, 3).join(', ');

  return `Research "${companyName}" for outbound sales.${contextLine}

ICP: ${icp.description}
Signals: ${signals} | Tech: ${icp.tech_keywords.slice(0, 3).join(', ')}

You have 2 web searches:
1. "${companyName} funding raised series investors"
2. "${companyName} jobs hiring ${icp.hiring_signals[0] || 'engineering'} news"

Return ONLY JSON:
{"website":"domain (no https://)","linkedin_url":"exact LinkedIn URL from results or null","signals":[{"type":"job_posting"|"news"|"funding"|"product_launch"|"other","title":"desc","key_phrases":["phrases"],"source_url":"real URL or null"}],"match_reason":"one sentence with a concrete fact","company_overview":"2-3 sentences","industry":"industry","funding_stage":"stage or Unknown","amount_raised":"e.g. $150M Series C or Unknown","sources":{"jobs":[{"title":"t","url":"u"}],"funding":[{"title":"t","url":"u"}],"news":[{"title":"t","url":"u"}]}}

Only use URLs from search results. For linkedin_url use exact URL found — do NOT guess.`;
}
