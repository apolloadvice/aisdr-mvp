import Anthropic from '@anthropic-ai/sdk';
import type { ICPCriteria, CompanySignal, TargetContact } from '@/lib/types';
import type { FindAllCompany } from '@/lib/services/parallel';

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  return new Anthropic({ apiKey });
}

export async function parseQueryToICP(input: string): Promise<ICPCriteria> {
  const client = getClient();

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Extract the Ideal Customer Profile (ICP) from this input. It may be a scoping call transcript, meeting notes, a short query, or a description of a target market. Pull out every detail about who they want to sell to, what buying signals to look for, and what kind of companies to target.

Return ONLY valid JSON matching this exact schema, no other text:

{
  "description": "one sentence summary of the ideal customer they want to find",
  "industry_keywords": ["industries or verticals mentioned"],
  "min_funding_amount": number or null,
  "funding_stages": ["Series A", "Series B", etc] or [],
  "hiring_signals": ["job titles, roles, or hiring patterns that indicate buying intent"],
  "tech_keywords": ["specific technologies, tools, or infrastructure mentioned"],
  "company_examples": ["any companies mentioned as examples or comparisons"]
}

Input:
${input}`
      }
    ]
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse ICP from query');

  const parsed: unknown = JSON.parse(jsonMatch[0]);
  if (!isICPCriteria(parsed)) throw new Error('Invalid ICP shape from AI');
  return parsed;
}

function isICPCriteria(value: unknown): value is ICPCriteria {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.description === 'string' &&
    Array.isArray(obj.industry_keywords) &&
    Array.isArray(obj.hiring_signals) &&
    Array.isArray(obj.tech_keywords) &&
    Array.isArray(obj.company_examples)
  );
}

export async function rankCompanies(
  companies: FindAllCompany[],
  icp: ICPCriteria,
  topN: number = 3
): Promise<string[]> {
  if (companies.length <= topN) return companies.map((c) => c.name);

  const client = getClient();

  const companySummaries = companies
    .map(
      (c, i) =>
        `${i + 1}. ${c.name}${c.description ? ` — ${c.description}` : ''}${c.match_reasoning ? ` | Match data: ${c.match_reasoning.slice(0, 300)}` : ''}`
    )
    .join('\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Given this ICP and candidate companies, return ONLY a JSON array of the top ${topN} company names that best fit the ICP. Rank by relevance. Return just the array, no other text.

ICP: ${icp.description}
- Industry: ${icp.industry_keywords.join(', ')}
- Hiring signals: ${icp.hiring_signals.join(', ')}
- Tech: ${icp.tech_keywords.join(', ')}
${icp.min_funding_amount ? `- Min funding: $${icp.min_funding_amount / 1_000_000}M` : ''}

Candidates:
${companySummaries}`
      }
    ]
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return companies.slice(0, topN).map((c) => c.name);

  try {
    const ranked: unknown = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(ranked) || !ranked.every((v) => typeof v === 'string')) {
      return companies.slice(0, topN).map((c) => c.name);
    }
    return ranked.slice(0, topN);
  } catch {
    return companies.slice(0, topN).map((c) => c.name);
  }
}

export async function generateCompanySummary(
  company: {
    name: string;
    website?: string;
    description?: string;
    match_reasoning?: string;
    research_text: string;
  },
  icp: ICPCriteria
): Promise<{
  signals: CompanySignal[];
  match_reason: string;
  company_overview: string;
  email_hook: string;
  industry: string;
  funding_stage: string;
  amount_raised: string;
  inferred_contacts: TargetContact[];
}> {
  const client = getClient();

  const findallContext = [
    company.description ? `FindAll summary: ${company.description}` : '',
    company.match_reasoning ? `FindAll match evaluation: ${company.match_reasoning}` : ''
  ]
    .filter(Boolean)
    .join('\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `You are an expert sales researcher. Given research about "${company.name}", extract precise signals, infer likely decision makers, and write a sharp email hook. Return ONLY valid JSON.

${findallContext ? `--- DISCOVERY CONTEXT ---\n${findallContext}\n` : ''}
--- DEEP RESEARCH ---
${company.research_text}

--- ICP CRITERIA ---
- Looking for: ${icp.description}
- Industry keywords: ${icp.industry_keywords.join(', ')}
- Hiring signals: ${icp.hiring_signals.join(', ')}
- Tech keywords: ${icp.tech_keywords.join(', ')}

Return JSON matching this schema exactly:
{
  "signals": [
    {
      "type": "job_posting" | "news" | "funding" | "product_launch" | "other",
      "title": "brief signal description",
      "key_phrases": ["exact phrases from the research that triggered this signal"]
    }
  ],
  "match_reason": "One specific sentence on why this company fits the ICP — cite a concrete fact, not a generic statement",
  "company_overview": "2-3 sentences: what the company does, their current stage, and specifically why they are a fit for the product/service described in the ICP. Be concrete.",
  "email_hook": "One sentence to open a cold email that references a SPECIFIC signal (job posting title, funding round, product name). Do NOT be generic — mention something only this company would recognize.",
  "industry": "primary industry",
  "funding_stage": "latest funding stage or 'Unknown'",
  "amount_raised": "total raised or latest round, e.g. '$150M Series C' or 'Unknown'",
  "inferred_contacts": [
    {
      "name": "Full name if found in research, otherwise a realistic placeholder like 'VP of Engineering'",
      "title": "Their title",
      "email": "best guess email or null",
      "is_decision_maker": true or false
    }
  ]
}

For inferred_contacts: Look through the research for named executives, founders, VPs, or hiring managers. List 1-3 people. Mark 1-2 as decision makers — these are the people who would sign a contract for what the ICP describes (typically VP+, C-suite, or Head of the relevant department). If you find real names in the research, use them. If not, infer the most likely titles (e.g. "VP of Infrastructure", "Head of ML Platform") based on the company's org and the ICP.

For email: If you know the company domain (from website or research), infer the most likely email using common patterns: first@domain.com, first.last@domain.com, or firstlast@domain.com. Use the most common pattern for tech companies (first@domain.com or first.last@domain.com). Only generate an email if you have both a real person name AND a domain. Set to null if either is unknown.

EXAMPLES of good vs bad output:

BAD email_hook: "I noticed your company is growing and hiring — would love to chat."
GOOD email_hook: "Saw your Senior MLOps Engineer posting mentions Kubernetes GPU scheduling — we built exactly that for teams scaling past 500 GPUs."

BAD match_reason: "They are an AI company that matches the criteria."
GOOD match_reason: "Their $85M Series B and three open GPU infrastructure roles signal they're scaling compute faster than their platform team can build."

BAD company_overview: "This is a technology company that does AI things."
GOOD company_overview: "Replicate provides a cloud API for running open-source ML models, recently raised $40M Series B to expand GPU capacity. Their push into enterprise inference hosting creates a direct need for GPU scheduling and orchestration tooling — exactly the infrastructure layer the ICP describes."`
      }
    ]
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Failed to generate summary for ${company.name}`);
  return JSON.parse(jsonMatch[0]);
}
