import Parallel from 'parallel-web';
import type { ICPCriteria } from '@/lib/types';
import type { CompanyDiscovery, DiscoveredCompany } from './interfaces';
import { serviceConfig } from './config';

function getClient(): Parallel {
  const apiKey = process.env.PARALLEL_API_KEY;
  if (!apiKey) throw new Error('PARALLEL_API_KEY is not set');
  return new Parallel({ apiKey });
}

/**
 * Parallel FindAll-based company discovery.
 * Implements CompanyDiscovery interface.
 */
export const parallelCompanyDiscovery: CompanyDiscovery = {
  async find(icp: ICPCriteria): Promise<DiscoveredCompany[]> {
    const client = getClient();

    const signalParts: string[] = [];
    if (icp.industry_keywords.length > 0) {
      signalParts.push(`Industries: ${icp.industry_keywords.join(', ')}`);
    }
    if (icp.min_funding_amount) {
      signalParts.push(`Ideally raised $${icp.min_funding_amount / 1_000_000}M+`);
    }
    if (icp.funding_stages.length > 0) {
      signalParts.push(`Funding stage: ${icp.funding_stages.join(' or ')}`);
    }
    if (icp.hiring_signals.length > 0) {
      signalParts.push(`Hiring signals: ${icp.hiring_signals.join(', ')}`);
    }
    if (icp.tech_keywords.length > 0) {
      signalParts.push(`Tech/tools: ${icp.tech_keywords.join(', ')}`);
    }
    if (icp.company_examples.length > 0) {
      signalParts.push(`Similar to: ${icp.company_examples.join(', ')}`);
    }

    const conditions = [
      {
        name: 'ICP fit',
        description: `${icp.description}. ${signalParts.length > 0 ? `Attributes to look for (not all required): ${signalParts.join('. ')}` : ''}`
      }
    ];

    const run = await client.beta.findall.create({
      objective: icp.description,
      entity_type: 'companies',
      match_conditions: conditions,
      generator: serviceConfig.findAllGenerator,
      match_limit: serviceConfig.findAllLimit
    });

    const findallId = run.findall_id;
    let runStatus = run.status.status;
    let attempts = 0;
    const maxAttempts = 60;

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 5000));
      const check = await client.beta.findall.retrieve(findallId);
      runStatus = check.status.status;
      attempts++;
    }

    if (runStatus !== 'completed') {
      throw new Error(`FindAll run ${findallId} ended with status: ${runStatus}`);
    }

    const result = await client.beta.findall.result(findallId);

    return result.candidates
      .filter((c) => c.match_status === 'matched')
      .map((c) => ({
        name: c.name,
        website: c.url || undefined,
        description: c.description || undefined,
        match_context: c.output ? JSON.stringify(c.output) : ''
      }));
  }
};
