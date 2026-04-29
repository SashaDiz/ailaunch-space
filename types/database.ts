import { z } from 'zod';
import {
  UserSchema,
  AppSchema,
  ProjectSubmissionSchema,
  PlanSelectionSchema,
  BasicInfoSchema,
  DetailsSchema,
  MediaSchema,
  LaunchWeekSchema,
  CompetitionSchema,
  CategorySchema,
  SidebarContentSchema,
  AnalyticsSchema,
  PaymentSchema,
  NewsletterSchema,
  BacklinkSchema,
  BookmarkSchema,
  RatingSchema,
  CommentSchema,
} from '@/lib/validations/schemas';

// ─── Auto-generated types from Zod schemas ───────────────────────────────────
// These types are derived from runtime Zod schemas, giving you both
// compile-time safety AND runtime validation from a single source of truth.

// Core entity types
export type User = z.infer<typeof UserSchema>;
export type App = z.infer<typeof AppSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type Competition = z.infer<typeof CompetitionSchema>;
export type Category = z.infer<typeof CategorySchema>;

// Content types
export type SidebarContent = z.infer<typeof SidebarContentSchema>;
export type Analytics = z.infer<typeof AnalyticsSchema>;
export type Newsletter = z.infer<typeof NewsletterSchema>;
export type Backlink = z.infer<typeof BacklinkSchema>;

// Social / engagement types
export type Bookmark = z.infer<typeof BookmarkSchema>;
export type Rating = z.infer<typeof RatingSchema>;
export type Comment = z.infer<typeof CommentSchema>;

// Submission step types
export type ProjectSubmission = z.infer<typeof ProjectSubmissionSchema>;
export type PlanSelection = z.infer<typeof PlanSelectionSchema>;
export type BasicInfo = z.infer<typeof BasicInfoSchema>;
export type Details = z.infer<typeof DetailsSchema>;
export type Media = z.infer<typeof MediaSchema>;
export type LaunchWeek = z.infer<typeof LaunchWeekSchema>;

// ─── Union / literal types ───────────────────────────────────────────────────

export type AppStatus = 'pending' | 'approved' | 'rejected' | 'live' | 'archived';
export type PlanType = 'standard' | 'premium';
export type LinkType = 'dofollow' | 'nofollow';
export type LinkTypeReason = 'weekly_winner' | 'manual_upgrade' | 'premium_plan';
export type UserRole = 'user' | 'admin' | 'moderator';
export type PricingTier = 'Free' | 'Freemium' | 'Paid';
export type CompetitionStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

// ─── Utility types ───────────────────────────────────────────────────────────

/** App with only the fields needed for listing/cards */
export type AppSummary = Pick<
  App,
  'id' | 'name' | 'slug' | 'short_description' | 'website_url' | 'logo_url' |
  'categories' | 'pricing' | 'plan' | 'status' | 'upvotes' | 'views' | 'clicks' |
  'weekly_position' | 'link_type' | 'premium_badge'
>;

/** User with only public-facing fields */
export type PublicUser = Pick<
  User,
  'id' | 'name' | 'bio' | 'image' | 'website' | 'twitter' | 'github' | 'linkedin' |
  'totalSubmissions' | 'reputation'
>;
