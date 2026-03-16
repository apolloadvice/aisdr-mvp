import Anthropic from '@anthropic-ai/sdk';
import type { ICPCriteria, CompanySignal, SourceLink } from '@/lib/types';
import type { CompanyResearcher, CompanyResearchResult } from './interfaces';
import { serviceConfig } from './config';
import { buildResearchAgentPrompt } from '@/lib/prompts/research-agent';

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  return new Anthropic({ apiKey, maxRetries: 0 });
}

/**
 * Extract all verified URLs from web search result blocks and text citations.
 */
function extractVerifiedUrls(content: Anthropic.ContentBlock[]): Map<string, string> {
  const urls = new Map<string, string>();

  for (const block of content) {
    if (block.type === 'web_search_tool_result' && 'content' in block) {
      const searchContent = (block as { content: unknown[] }).content;
      if (Array.isArray(searchContent)) {
        for (const item of searchContent) {
          const entry = item as { type?: string; url?: string; title?: string };
          if (entry.type === 'web_search_result' && entry.url) {
            urls.set(entry.url, entry.title || '');
          }
        }
      }
    }

    if (block.type === 'text') {
      const textBlock = block as { citations?: Array<{ url?: string; title?: string }> };
      if (Array.isArray(textBlock.citations)) {
        for (const cite of textBlock.citations) {
          if (cite.url) {
            urls.set(cite.url, cite.title || '');
          }
        }
      }
    }
  }

  return urls;
}

function isUrlTrusted(url: string, verifiedUrls: Map<string, string>): boolean {
  if (verifiedUrls.has(url)) return true;
  const safePatterns = [
    'linkedin.com/jobs/search',
    'linkedin.com/search/results',
    'crunchbase.com/textsearch',
    'news.google.com/search'
  ];
  return safePatterns.some((p) => url.includes(p));
}

function categorizeUrl(url: string): 'jobs' | 'funding' | 'news' {
  if (/jobs?|careers?|hiring|lever\.co|greenhouse|ashby|workable|breezy/i.test(url)) {
    return 'jobs';
  }
  if (/funding|raised|series|crunchbase|pitchbook|techcrunch.*rais/i.test(url)) {
    return 'funding';
  }
  return 'news';
}

function buildFallbackSources(companyName: string): CompanyResearchResult['sources'] {
  const encodedName = encodeURIComponent(companyName);
  return {
    jobs: [
      {
        title: `${companyName} on LinkedIn Jobs`,
        url: `https://www.linkedin.com/jobs/search/?keywords=${encodedName}`
      }
    ],
    funding: [
      {
        title: `${companyName} on Crunchbase`,
        url: `https://www.crunchbase.com/textsearch?q=${encodedName}`
      }
    ],
    news: [
      {
        title: `${companyName} — recent news`,
        url: `https://news.google.com/search?q=${encodedName}`
      }
    ]
  };
}

export const claudeResearchAgent: CompanyResearcher = {
  async research(
    companyName: string,
    icp: ICPCriteria,
    context?: { description?: string; website?: string }
  ): Promise<CompanyResearchResult> {
    const client = getClient();

    const response = await client.messages.create({
      model: serviceConfig.researchModel,
      max_tokens: serviceConfig.researchMaxTokens,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: serviceConfig.maxSearchesPerCompany
        }
      ],
      messages: [
        {
          role: 'user',
          content: buildResearchAgentPrompt(companyName, icp, context)
        }
      ]
    });

    // Build citation index from actual search results
    const verifiedUrls = extractVerifiedUrls(response.content);

    // Extract text and resolve cite tags to inline source links
    let fullText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        fullText += block.text;
      }
    }

    // Strip all <cite> tags, keep inner text
    const cleanText = fullText.replace(/<cite[^>]*>([\s\S]*?)<\/cite>/g, '$1');

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Research agent failed for ${companyName}`);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Strip citations from string fields too
    const stripCites = (s: string) => s.replace(/<cite[^>]*>([\s\S]*?)<\/cite>/g, '$1');

    // Strip hallucinated URLs from signals
    const signals: CompanySignal[] = (parsed.signals || []).map(
      (s: { type: string; title: string; key_phrases: string[]; source_url?: string }) => ({
        type: s.type,
        title: s.title,
        key_phrases: s.key_phrases || [],
        source_url:
          s.source_url && isUrlTrusted(s.source_url, verifiedUrls) ? s.source_url : undefined
      })
    );

    // Build sources from verified URLs
    const sources: CompanyResearchResult['sources'] = { jobs: [], funding: [], news: [] };
    for (const [url, title] of verifiedUrls) {
      const category = categorizeUrl(url);
      sources[category].push({ title, url });
    }

    // Fallbacks
    const fallbacks = buildFallbackSources(companyName);
    if (sources.jobs.length === 0) sources.jobs = fallbacks.jobs;
    if (sources.funding.length === 0) sources.funding = fallbacks.funding;
    if (sources.news.length === 0) sources.news = fallbacks.news;

    return {
      signals,
      match_reason: stripCites(parsed.match_reason || ''),
      company_overview: stripCites(parsed.company_overview || ''),
      email_hook: stripCites(parsed.email_hook || ''),
      industry: parsed.industry || 'Unknown',
      funding_stage: parsed.funding_stage || 'Unknown',
      amount_raised: parsed.amount_raised || 'Unknown',
      inferred_contacts: parsed.inferred_contacts || [],
      sources
    };
  }
};
