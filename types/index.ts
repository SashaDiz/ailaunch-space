// ─── Type Re-exports ─────────────────────────────────────────────────────────
// Central export point for all application types.
// Usage: import type { User, App, SiteConfig } from '@/types';

// Database / entity types (derived from Zod schemas)
export type {
  User,
  App,
  Payment,
  Competition,
  Category,
  SidebarContent,
  Analytics,
  Newsletter,
  Backlink,
  Bookmark,
  Rating,
  Comment,
  ProjectSubmission,
  PlanSelection,
  BasicInfo,
  Details,
  Media,
  LaunchWeek,
  AppStatus,
  PlanType,
  LinkType,
  LinkTypeReason,
  UserRole,
  PricingTier,
  CompetitionStatus,
  PaymentStatus,
  AppSummary,
  PublicUser,
} from './database';

// Configuration types
export type {
  SiteConfig,
  FeaturesConfig,
  PaymentProvider,
  PlanFeatures,
  Plan,
  PlansConfig,
  AnalyticsConfig,
  EmailConfig,
  PaymentsConfig,
  DirectoryConfig,
  SortOption,
  PricingFilterOption,
  SeedCategory,
  AutoSubmitBannerConfig,
} from './config';

// API types
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  ListQueryParams,
  ProjectListParams,
} from './api';

// Payment adapter types
export type {
  CheckoutParams,
  CheckoutResult,
  WebhookEvent,
  PaymentStatusResult,
  CreateCouponParams,
  CouponResult,
  PaymentAdapter,
} from './payments';
