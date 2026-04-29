import type { FeaturesConfig } from '@/types/config';

/**
 * Feature Flags
 *
 * Toggle optional modules on/off. The core platform (submissions,
 * payments, auth, admin) is always active.
 *
 * Set a feature to `false` to:
 * - Hide its UI components
 * - Return 404 from its API routes
 * - Skip its cron jobs
 * - Exclude its DB tables from setup
 */
export const featuresConfig: FeaturesConfig = {
  /** Partner/sponsor program with sidebar placements */
  partners: true,

  /** Featured badges with embeddable code */
  badges: true,

  /** Dofollow/nofollow backlink management */
  backlinks: true,

  /** Social proof widgets and live counters */
  socialProof: true,

  /** Newsletter subscription and email digest */
  newsletter: true,

  /** Blog section (markdown files in content/blog/) */
  blog: true,

  /** External webhook notifications (Discord, Slack) */
  webhooksExternal: true,

  /** Top ad banner below header (horizontal promo block) */
  adBanner: true,

  /** Bookmark/favorite projects */
  bookmarks: true,

  /** Star ratings on projects */
  ratings: true,

  /** Comments on projects */
  comments: true,

  /** Paid promotion placements (banner, catalog cards, detail page cards) */
  promotions: true,

  /** AI-powered features (auto-fill from URL, description generation, category suggestions, SEO metadata) */
  ai: true,

  /** Enhanced analytics tracking (device/browser/country, per-project, events) */
  analytics: true,

  /** Multi-language support via next-intl (requires messages/{locale}.json files) */
  i18n: true,
};
