/**
 * Centralized configuration for all service providers.
 * Change models, limits, or providers in one place.
 */
export const serviceConfig = {
  /** Model used for lightweight tasks: ICP parsing, ranking */
  fastModel: 'claude-haiku-4-5-20251001',

  /** Model used for deep research with tool use */
  researchModel: 'claude-haiku-4-5-20251001',

  /** Max web searches per company research agent call */
  maxSearchesPerCompany: 2,

  /** Max tokens for research agent output */
  researchMaxTokens: 4096,

  /** Max tokens for ICP parsing */
  parseMaxTokens: 1024,

  /** Max companies to return from FindAll */
  findAllLimit: 5,

  /** Parallel FindAll generator tier */
  findAllGenerator: 'preview' as const
} as const;
