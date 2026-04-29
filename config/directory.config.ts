import type { DirectoryConfig } from '@/types/config';

/**
 * Directory Configuration
 *
 * Controls project listing behavior: sorting, filtering, pagination,
 * and seed categories. Change these to customize your directory.
 */
export const directoryConfig: DirectoryConfig = {
  /** Default number of projects per page */
  pageSize: 40,

  /** Sort options shown in the UI and used by the API */
  sortOptions: [
    { value: 'newest', label: 'Latest', sort: { created_at: -1, premium_badge: -1 } },
    { value: 'popular', label: 'Most Popular', sort: { upvotes: -1, premium_badge: -1, created_at: -1 } },
    { value: 'top_rated', label: 'Top Rated', sort: { average_rating: -1, ratings_count: -1, created_at: -1 } },
    { value: 'views', label: 'Most Views', sort: { views: -1, premium_badge: -1, upvotes: -1 } },
    { value: 'name_asc', label: 'Name (A to Z)', sort: { name: 1, created_at: -1 } },
    { value: 'name_desc', label: 'Name (Z to A)', sort: { name: -1, created_at: -1 } },
  ],

  /** Default sort key (must match a value in sortOptions) */
  defaultSort: 'newest',

  /** Pricing filter options for the filter UI */
  pricingOptions: [
    { value: 'all', label: 'All' },
    { value: 'free', label: 'Free' },
    { value: 'freemium', label: 'Freemium' },
    { value: 'paid', label: 'Paid' },
  ],

  /**
   * Seed categories — auto-created in the database if missing.
   * Replace with categories relevant to your directory niche.
   * The `categories` table is the source of truth at runtime.
   */
  seedCategories: [
    {
      name: 'SaaS',
      slug: 'saas',
      description: 'Software as a Service products',
      sphere: 'Software',
      sort_order: 1,
    },
    {
      name: 'Developer Tools',
      slug: 'developer-tools',
      description: 'Tools and utilities for developers',
      sphere: 'Software',
      sort_order: 2,
    },
    {
      name: 'Design',
      slug: 'design',
      description: 'Design tools and resources',
      sphere: 'Creative',
      sort_order: 3,
    },
    {
      name: 'Marketing',
      slug: 'marketing',
      description: 'Marketing and growth tools',
      sphere: 'Business',
      sort_order: 4,
    },
    {
      name: 'Other',
      slug: 'other',
      description: 'Projects that do not fit existing categories',
      sphere: 'Other',
      sort_order: 99,
    },
  ],
};

// ─── Helper functions ────────────────────────────────────────────────────────

/** Get sort DB fields for a given sort key, with fallback to default */
export function getSortFields(sortKey: string): Record<string, number> {
  const option = directoryConfig.sortOptions.find((o) => o.value === sortKey);
  if (option) return option.sort;
  const defaultOption =
    directoryConfig.sortOptions.find((o) => o.value === directoryConfig.defaultSort) ||
    directoryConfig.sortOptions[0];
  return defaultOption.sort;
}

/** Get pricing option values (for validation) */
export function getPricingValues(): string[] {
  return directoryConfig.pricingOptions.map((o) => o.value);
}

/** Get sort option values (for validation) */
export function getSortValues(): string[] {
  return directoryConfig.sortOptions.map((o) => o.value);
}
