/**
 * AI Configuration
 *
 * Configure the AI provider and model for the auto-fill, description,
 * category, and SEO helpers. Requires the 'ai' feature flag to be
 * enabled in features.config.ts.
 *
 * Supported providers: 'anthropic' (default), 'openai'
 * Set AI_API_KEY in .env.local to activate.
 */
export const aiConfig = {
  provider: (process.env.AI_PROVIDER as 'anthropic' | 'openai') || 'anthropic',
  model: process.env.AI_MODEL || 'claude-haiku-4-5',
  apiKey: process.env.AI_API_KEY || '',
  maxTokens: 1500,
  temperature: 0.4,
};
