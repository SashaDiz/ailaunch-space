import type { AnalyticsConfig } from '@/types/config';

/**
 * Analytics Configuration
 *
 * Enable one or more analytics providers by setting the corresponding
 * environment variables. Leave a provider commented out or remove it
 * entirely to disable it.
 *
 * Scripts are conditionally rendered in app/layout.tsx based on this config.
 */
export const analyticsConfig: AnalyticsConfig = {
  // Google Analytics 4
  ...(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && {
    googleAnalytics: {
      measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    },
  }),

  // PostHog (product analytics)
  ...(process.env.NEXT_PUBLIC_POSTHOG_KEY && {
    posthog: {
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    },
  }),

  // DataFast (datafa.st) — traffic + revenue attribution.
  // The tracking script needs the website id; the admin dashboard additionally
  // needs a server-only `DATAFAST_API_KEY` (see lib/datafast.ts).
  datafast: {
    websiteId:
      process.env.NEXT_PUBLIC_DATAFAST_WEBSITE_ID || 'dfid_K2susEcvm7yr9F7rh2aII',
    domain: process.env.NEXT_PUBLIC_DATAFAST_DOMAIN || 'www.ailaunch.space',
  },
};
