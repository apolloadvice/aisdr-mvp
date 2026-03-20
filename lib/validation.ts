import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitives — reusable bounded strings and arrays
// ---------------------------------------------------------------------------

/** String capped at a reasonable length to prevent payload bloat */
const shortStr = z.string().max(500);
const mediumStr = z.string().max(5_000);
const longStr = z.string().max(50_000);
const urlStr = z.string().max(2_000);

/** Array of short strings, capped at a sane count */
function strArray(maxItems: number) {
  return z.array(shortStr).max(maxItems);
}

// ---------------------------------------------------------------------------
// Domain schemas — strict variants for user-authored input
// ---------------------------------------------------------------------------

export const icpCriteriaSchema = z.object({
  description: mediumStr,
  industry_keywords: strArray(50),
  min_employees: z.number().nullable(),
  max_employees: z.number().nullable(),
  min_funding_amount: z.number().nullable(),
  funding_stages: strArray(20),
  hiring_signals: strArray(50),
  tech_keywords: strArray(50),
  company_examples: strArray(50)
});

export const strategyMessageSchema = z.object({
  role: z.enum(['assistant', 'user']),
  content: longStr
});

// Domain schemas — loose variants for server-produced data
//
// These are stored in sessions after being produced by our own pipeline.
// Use .loose() so we don't silently strip fields if the pipeline
// adds new ones before the schema is updated.
const sourceLinkLoose = z
  .object({
    title: shortStr,
    url: urlStr
  })
  .loose();

const companySignalLoose = z
  .object({
    type: z.enum(['job_posting', 'news', 'funding', 'product_launch', 'other']),
    title: shortStr,
    key_phrases: strArray(20),
    source_url: urlStr.optional()
  })
  .loose();

const targetContactLoose = z
  .object({
    name: shortStr,
    title: shortStr,
    linkedin_url: urlStr,
    email: shortStr.nullable(),
    is_decision_maker: z.boolean()
  })
  .loose();

const companyResultLoose = z
  .object({
    company_name: shortStr,
    industry: shortStr,
    funding_stage: shortStr,
    amount_raised: shortStr,
    website: urlStr.nullable(),
    linkedin_url: urlStr,
    logo_url: urlStr,
    signals: z.array(companySignalLoose).max(50),
    match_reason: mediumStr,
    company_overview: mediumStr,
    sources: z.object({
      jobs: z.array(sourceLinkLoose).max(50),
      funding: z.array(sourceLinkLoose).max(50),
      news: z.array(sourceLinkLoose).max(50)
    })
  })
  .loose();

const candidateLoose = z
  .object({
    name: shortStr,
    website: urlStr.optional(),
    description: mediumStr.optional(),
    linkedin_url: urlStr.optional(),
    logo_url: urlStr.optional(),
    apollo_org_id: shortStr.optional()
  })
  .loose();

const apolloPersonLoose = z
  .object({
    apollo_person_id: shortStr,
    first_name: shortStr,
    last_name_obfuscated: shortStr,
    title: shortStr.nullable(),
    organization_name: shortStr,
    has_email: z.boolean(),
    has_direct_phone: z.boolean()
  })
  .loose();

const generatedEmailLoose = z
  .object({
    subject: shortStr,
    body: longStr
  })
  .loose();

const emailSequenceLoose = z.object({
  emails: z.tuple([generatedEmailLoose, generatedEmailLoose, generatedEmailLoose])
});

// Record key — company names and compound keys like "Company::email"
const recordKey = z.string().max(1_000);

// Strict domain schemas — for validating user-authored input to the LLM
export const targetContactSchema = z.object({
  name: shortStr,
  title: shortStr,
  linkedin_url: urlStr,
  email: shortStr.nullable(),
  is_decision_maker: z.boolean()
});

export const companyResultSchema = z.object({
  company_name: shortStr,
  industry: shortStr,
  funding_stage: shortStr,
  amount_raised: shortStr,
  website: urlStr.nullable(),
  linkedin_url: urlStr,
  logo_url: urlStr,
  signals: z.array(companySignalLoose).max(50),
  match_reason: mediumStr,
  company_overview: mediumStr,
  sources: z.object({
    jobs: z.array(sourceLinkLoose).max(50),
    funding: z.array(sourceLinkLoose).max(50),
    news: z.array(sourceLinkLoose).max(50)
  })
});

export const candidateSchema = z.object({
  name: shortStr,
  website: urlStr.optional(),
  description: mediumStr.optional(),
  linkedin_url: urlStr.optional(),
  logo_url: urlStr.optional(),
  apollo_org_id: shortStr.optional()
});

// API request schemas
export const createIcpBodySchema = z.object({
  name: shortStr.min(1),
  icp: icpCriteriaSchema
});

export const updateIcpBodySchema = z.object({
  name: shortStr.optional(),
  icp: icpCriteriaSchema.optional()
});

export const sessionCreateBodySchema = z.object({
  name: shortStr.optional(),
  transcript: longStr.optional(),
  step: shortStr.optional(),
  icp: icpCriteriaSchema.optional(),
  strategy_messages: z.array(strategyMessageSchema).max(200).optional(),
  candidates: z.array(candidateLoose).max(200).optional(),
  selected_companies: strArray(200).optional(),
  results: z.array(companyResultLoose).max(200).optional(),
  people_results: z.record(recordKey, z.array(apolloPersonLoose).max(100)).optional(),
  email_sequences: z.record(recordKey, emailSequenceLoose).optional()
});

export const sessionUpdateBodySchema = z.object({
  name: shortStr.optional(),
  step: shortStr.optional(),
  transcript: longStr.optional(),
  icp: icpCriteriaSchema.nullable().optional(),
  strategy_messages: z.array(strategyMessageSchema).max(200).optional(),
  candidates: z.array(candidateLoose).max(200).optional(),
  selected_companies: strArray(200).optional(),
  results: z.array(companyResultLoose).max(200).optional(),
  people_results: z.record(recordKey, z.array(apolloPersonLoose).max(100)).optional(),
  email_sequences: z.record(recordKey, emailSequenceLoose).optional(),
  status: z.enum(['in_progress', 'completed']).optional()
});

export const strategyBodySchema = z.object({
  icp: icpCriteriaSchema,
  messages: z.array(strategyMessageSchema).max(200).optional()
});

export const researchBodySchema = z.object({
  icp: icpCriteriaSchema,
  companies: z.array(shortStr).max(200).optional(),
  candidates: z.array(candidateLoose).max(200).optional()
});

export const emailGenerateBodySchema = z.object({
  company: companyResultLoose,
  contact: targetContactLoose,
  icp: icpCriteriaSchema
});

export const emailSendBodySchema = z.object({
  to: z.string().email().max(320),
  subject: shortStr.min(1),
  body: longStr.min(1),
  companyName: shortStr,
  contactName: shortStr,
  sessionId: shortStr.optional()
});

export const signatureCreateBodySchema = z.object({
  name: shortStr.min(1),
  body: mediumStr.min(1)
});

export const signatureUpdateBodySchema = z.object({
  name: shortStr.optional(),
  body: mediumStr.optional(),
  is_default: z.boolean().optional()
});

export const profileUpdateBodySchema = z.object({
  full_name: shortStr
});

export const peopleSearchBodySchema = z.object({
  org_ids: z.array(shortStr).max(200),
  icp: icpCriteriaSchema,
  companies: z
    .array(
      z.object({
        name: shortStr,
        apollo_org_id: shortStr
      })
    )
    .max(200)
});

export const peopleEnrichBodySchema = z.object({
  person_id: shortStr.min(1)
});

export const parseIcpBodySchema = z.object({
  input: longStr.min(1)
});

// Helper — parse and return 400 on failure
export function parseBody<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: Response } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  console.error('[Validation]', issues);
  return {
    success: false,
    response: Response.json({ error: `Validation failed: ${issues}` }, { status: 400 })
  };
}
