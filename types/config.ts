// ─── Site Configuration ──────────────────────────────────────────────────────

export interface SiteConfig {
  /** Site name displayed across the platform */
  name: string;
  /** Short tagline for headers and OG tags */
  tagline: string;
  /** Full description for SEO meta tags */
  description: string;
  /** Base URL of the site (from NEXT_PUBLIC_APP_URL) */
  url: string;
  /** Logo paths for light and dark modes */
  logo: {
    light: string;
    dark: string;
  };
  /** Favicon path */
  favicon: string;
  /** OG image path for social sharing */
  ogImage: string;
  /** Social media links */
  social: {
    twitter?: string;
    github?: string;
    discord?: string;
  };
  /** Contact information */
  contact: {
    email: string;
    supportEmail?: string;
    privacyEmail?: string;
  };
  /** Footer content */
  footer: {
    copyright: string;
    description: string;
  };
  /** URL ref parameter added to outbound links (e.g. "mydir") */
  refParameter: string;
  /** Default SEO keywords */
  keywords: string[];
  /** Language code */
  language: string;
  /** Locale code */
  locale: string;
  /** Theme color for mobile browsers */
  themeColor: string;
}

// ─── Feature Flags ───────────────────────────────────────────────────────────

export interface FeaturesConfig {
  /** Partner/sponsor program */
  partners: boolean;
  /** Featured badges with embed codes */
  badges: boolean;
  /** Dofollow/nofollow backlink management */
  backlinks: boolean;
  /** Social proof widgets and counters */
  socialProof: boolean;
  /** Newsletter subscription and digest */
  newsletter: boolean;
  /** Blog / changelog powered by SEObot */
  blog: boolean;
  /** External webhook notifications (Discord, Slack) */
  webhooksExternal: boolean;
  /** Top ad banner below header */
  adBanner: boolean;
  /** Bookmark/favorite projects */
  bookmarks: boolean;
  /** Star ratings on projects */
  ratings: boolean;
  /** Comments on projects */
  comments: boolean;
  /** Paid promotion placements (banner, catalog cards, detail page cards) */
  promotions: boolean;
  /** AI-powered features (description generation, category suggestions, SEO metadata) */
  ai: boolean;
  /** Enhanced analytics tracking */
  analytics: boolean;
  /** Multi-language support via next-intl */
  i18n: boolean;
}

// ─── Marketing Configuration ────────────────────────────────────────────────

export interface AdBannerConfig {
  enabled: boolean;
  text: string;
  buttonText: string;
  buttonLink: string;
  iconSrc: string;
  iconAlt: string;
}

export interface MockPromotionConfig {
  enabled: boolean;
  name: string;
  shortDescription: string;
  logoUrl: string;
  websiteUrl: string;
  ctaText: string;
}

export interface MarketingConfig {
  adBanner: AdBannerConfig;
  mockPromotion: MockPromotionConfig;
}

// ─── Auto-Submit Banner Configuration ───────────────────────────────────────

export interface AutoSubmitBannerConfig {
  enabled: boolean;
  title: string;
  description: string;
  benefits: string[];
  ctaText: string;
  checkoutUrl: string;
  price: string;
  learnMoreUrl: string;
  learnMoreText: string;
  dismissText: string;
  dashboardCtaText: string;
  projectDetailHeading: string;
  projectDetailDescription: string;
  projectDetailCtaText: string;
  projectDetailDismissText: string;
}

// ─── Payment Configuration ───────────────────────────────────────────────────

export type PaymentProvider = 'polar' | 'stripe' | 'lemon' | 'paddle' | 'none';

export interface PlanFeatures {
  homepage_duration: number;
  guaranteed_backlinks: number;
  premium_badge: boolean;
  skip_queue: boolean;
  social_promotion: boolean;
  priority_support: boolean;
  /** Allow custom features per plan */
  [key: string]: unknown;
}

export interface Plan {
  /** Unique plan identifier (e.g. "standard", "premium") */
  id: string;
  /** Display name */
  name: string;
  /** Price in the configured currency */
  price: number;
  /** Payment type */
  type: 'free' | 'one-time' | 'subscription';
  /** Short description for pricing page */
  description: string;
  /** Plan feature flags and limits */
  features: PlanFeatures;
  /** Payment provider price ID (null for free plans) */
  priceId: string | null;
  /** CTA button text */
  cta: string;
  /** Highlight as recommended on pricing page */
  highlighted?: boolean;
}

export interface PlansConfig {
  /** Currency code (e.g. "USD") */
  currency: string;
  /** Available plans — at least one required */
  plans: Plan[];
}

// ─── Analytics Configuration ─────────────────────────────────────────────────

export interface AnalyticsConfig {
  googleAnalytics?: {
    measurementId: string;
  };
  posthog?: {
    apiKey: string;
    host: string;
  };
}

// ─── Email Configuration ─────────────────────────────────────────────────────

export interface EmailConfig {
  /** Email service provider */
  provider: 'resend' | 'sendgrid' | 'ses';
  /** Default "From" address */
  from: {
    name: string;
    email: string;
  };
  /** Reply-to address */
  replyTo?: string;
  /** Email signature (e.g. "The MyDir Team") */
  teamSignature: string;
}

// ─── Payments Provider Config ────────────────────────────────────────────────

export interface PaymentsConfig {
  /** Active payment provider */
  provider: PaymentProvider;
  /** Enable test/sandbox mode */
  testMode: boolean;
}

// ─── Directory Configuration ────────────────────────────────────────────────

export interface SortOption {
  /** URL param value (e.g. "newest") */
  value: string;
  /** Display label in the UI */
  label: string;
  /** Database sort fields (e.g. { created_at: -1 }) */
  sort: Record<string, number>;
}

export interface PricingFilterOption {
  /** URL param value (e.g. "free") */
  value: string;
  /** Display label in the UI */
  label: string;
}

export interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  sphere: string;
  sort_order: number;
  featured?: boolean;
}

export interface DirectoryConfig {
  pageSize: number;
  sortOptions: SortOption[];
  defaultSort: string;
  pricingOptions: PricingFilterOption[];
  seedCategories: SeedCategory[];
}
