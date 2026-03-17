/**
 * Centralized configuration for all service providers.
 * Change models, limits, or providers in one place.
 */
export const serviceConfig = {
  /** Model used for lightweight tasks: ICP parsing, scoring */
  fastModel: 'claude-haiku-4-5-20251001',

  /** Model used for deep research with tool use */
  researchModel: 'claude-haiku-4-5-20251001',

  /** Max web searches per company research agent call */
  maxSearchesPerCompany: 2,

  /** Max tokens for research agent output */
  researchMaxTokens: 4096,

  /** Max tokens for ICP parsing */
  parseMaxTokens: 1024,

  /** Max tokens for Claude batch scoring */
  scoringMaxTokens: 2048,

  /** Minimum ICP score (1-10) to include a company in results */
  scoringMinScore: 5,

  /** Apollo results per page (max 100) */
  apolloPerPage: 25,

  /** Apollo API base URL */
  apolloBaseUrl: 'https://api.apollo.io/api/v1'
} as const;
