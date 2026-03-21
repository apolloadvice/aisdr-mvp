import {
  parseBody,
  icpCriteriaSchema,
  profileUpdateBodySchema,
  emailSendBodySchema,
  createIcpBodySchema,
  parseIcpBodySchema
} from '@/lib/validation';

beforeEach(() => jest.spyOn(console, 'error').mockImplementation());
afterEach(() => jest.restoreAllMocks());

// ---------------------------------------------------------------------------
// parseBody helper
// ---------------------------------------------------------------------------

describe('parseBody', () => {
  it('returns success with valid data', () => {
    const result = parseBody(profileUpdateBodySchema, { full_name: 'Alice' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.full_name).toBe('Alice');
    }
  });

  it('returns failure with invalid data', () => {
    const result = parseBody(profileUpdateBodySchema, { full_name: 123 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });

  it('returns failure when required fields are missing', () => {
    const result = parseBody(profileUpdateBodySchema, {});
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ICP criteria schema
// ---------------------------------------------------------------------------

describe('icpCriteriaSchema', () => {
  const validIcp = {
    description: 'B2B SaaS companies',
    industry_keywords: ['saas'],
    min_employees: 10,
    max_employees: 500,
    min_funding_amount: null,
    funding_stages: [],
    hiring_signals: [],
    tech_keywords: [],
    company_examples: [],
    locations: []
  };

  it('accepts valid ICP', () => {
    const result = icpCriteriaSchema.safeParse(validIcp);
    expect(result.success).toBe(true);
  });

  it('defaults locations to empty array', () => {
    const { locations: _, ...withoutLocations } = validIcp;
    const result = icpCriteriaSchema.safeParse(withoutLocations);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locations).toEqual([]);
    }
  });

  it('rejects oversized description', () => {
    const result = icpCriteriaSchema.safeParse({
      ...validIcp,
      description: 'x'.repeat(5001)
    });
    expect(result.success).toBe(false);
  });

  it('rejects too many industry keywords', () => {
    const result = icpCriteriaSchema.safeParse({
      ...validIcp,
      industry_keywords: Array(51).fill('keyword')
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Email send schema
// ---------------------------------------------------------------------------

describe('emailSendBodySchema', () => {
  const validEmail = {
    to: 'test@example.com',
    subject: 'Hello',
    body: 'Body text',
    companyName: 'Acme',
    contactName: 'Alice'
  };

  it('accepts valid email', () => {
    const result = emailSendBodySchema.safeParse(validEmail);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email address', () => {
    const result = emailSendBodySchema.safeParse({ ...validEmail, to: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects empty subject', () => {
    const result = emailSendBodySchema.safeParse({ ...validEmail, subject: '' });
    expect(result.success).toBe(false);
  });

  it('accepts optional sessionId', () => {
    const result = emailSendBodySchema.safeParse({ ...validEmail, sessionId: 'abc-123' });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Create ICP body schema
// ---------------------------------------------------------------------------

describe('createIcpBodySchema', () => {
  it('rejects empty name', () => {
    const result = createIcpBodySchema.safeParse({
      name: '',
      icp: {
        description: 'test',
        industry_keywords: [],
        min_employees: null,
        max_employees: null,
        min_funding_amount: null,
        funding_stages: [],
        hiring_signals: [],
        tech_keywords: [],
        company_examples: []
      }
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Parse ICP body schema
// ---------------------------------------------------------------------------

describe('parseIcpBodySchema', () => {
  it('accepts non-empty input', () => {
    const result = parseIcpBodySchema.safeParse({ input: 'B2B SaaS in fintech' });
    expect(result.success).toBe(true);
  });

  it('rejects empty input', () => {
    const result = parseIcpBodySchema.safeParse({ input: '' });
    expect(result.success).toBe(false);
  });
});
