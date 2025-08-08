import { z } from "zod";

// User Schema (synced with Clerk via webhooks)
export const UserSchema = z.object({
  _id: z.string().optional(),
  clerkId: z.string(), // Clerk user ID
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  imageUrl: z.string().url().optional(),
  emailVerified: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  // Additional custom fields from Clerk public metadata
  bio: z.string().max(500).optional(),
  website: z.string().url().optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  location: z.string().optional(),
  // App-specific fields
  totalSubmissions: z.number().default(0),
  subscription: z.enum(["free", "premium", "lifetime"]).default("free"),
  subscriptionExpiry: z.date().optional(),
  isActive: z.boolean().default(true),
  deletedAt: z.date().optional(),
});

// App/Product Schema
export const AppSchema = z.object({
  _id: z.string().optional(),
  // Basic Information
  name: z.string().min(1, "App name is required").max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Invalid slug format"),
  short_description: z
    .string()
    .min(10, "Short description must be at least 10 characters")
    .max(200),
  full_description: z
    .string()
    .min(50, "Full description must be at least 50 characters")
    .max(3000),

  // URLs and Media
  website_url: z.string().url("Invalid website URL"),
  logo_url: z.string().url("Invalid logo URL").optional(),
  screenshots: z.array(z.string().url()).max(5).default([]),
  video_url: z.string().url().optional().or(z.literal("")),

  // Categorization
  categories: z
    .array(z.string())
    .min(1, "At least one category is required")
    .max(3),
  pricing: z.enum(["Free", "Freemium", "Paid"]),
  tags: z.array(z.string()).optional(),

  // Launch Information
  launch_week: z.string(), // Format: "2024-W01"
  launch_date: z.date(),

  // Contact and Ownership
  contact_email: z.string().email(),
  submitted_by: z.string(), // User ID

  // Plan and Features
  plan: z.enum(["standard", "premium", "support"]),
  backlink_url: z.string().url().optional(), // Required for support plan

  // Status and Moderation
  status: z
    .enum(["pending", "approved", "rejected", "live", "archived"])
    .default("pending"),
  rejection_reason: z.string().optional(),
  featured: z.boolean().default(false),

  // Engagement Metrics
  views: z.number().default(0),
  upvotes: z.number().default(0),
  downvotes: z.number().default(0),
  clicks: z.number().default(0),

  // Ranking
  ranking_score: z.number().default(0),
  weekly_ranking: z.number().optional(),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  publishedAt: z.date().optional(),

  // SEO
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
});

// Launch Week Schema
export const LaunchWeekSchema = z.object({
  _id: z.string().optional(),
  week_id: z.string().regex(/^\d{4}-W\d{2}$/, "Invalid week format"), // e.g., "2024-W01"
  start_date: z.date(),
  end_date: z.date(),
  status: z.enum(["upcoming", "active", "completed"]),
  featured_apps: z.array(z.string()), // App IDs
  winner: z.string().optional(), // App ID of the winner
  theme: z.string().optional(),
  description: z.string().optional(),
  total_submissions: z.number().default(0),
  total_votes: z.number().default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Vote Schema
export const VoteSchema = z.object({
  _id: z.string().optional(),
  user_id: z.string(),
  app_id: z.string(),
  vote_type: z.enum(["upvote", "downvote"]),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});

// Category Schema
export const CategorySchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1).max(50),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().max(200).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  app_count: z.number().default(0),
  featured: z.boolean().default(false),
  sort_order: z.number().default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Analytics Schema
export const AnalyticsSchema = z.object({
  _id: z.string().optional(),
  app_id: z.string(),
  date: z.date(),
  views: z.number().default(0),
  clicks: z.number().default(0),
  upvotes: z.number().default(0),
  downvotes: z.number().default(0),
  referrers: z.record(z.number()).optional(), // { "google.com": 5, "twitter.com": 2 }
  countries: z.record(z.number()).optional(), // { "US": 10, "UK": 5 }
  devices: z.record(z.number()).optional(), // { "desktop": 8, "mobile": 7 }
});

// Payment Schema
export const PaymentSchema = z.object({
  _id: z.string().optional(),
  user_id: z.string(),
  app_id: z.string().optional(),
  plan: z.enum(["premium", "support"]),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  payment_method: z.string(), // stripe, paypal, etc.
  payment_id: z.string(), // External payment ID
  status: z.enum(["pending", "completed", "failed", "refunded"]),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Newsletter Subscription Schema
export const NewsletterSchema = z.object({
  _id: z.string().optional(),
  email: z.string().email(),
  status: z.enum(["subscribed", "unsubscribed"]),
  source: z.string().optional(), // Where they subscribed from
  preferences: z
    .object({
      weekly_digest: z.boolean().default(true),
      new_launches: z.boolean().default(true),
      featured_apps: z.boolean().default(true),
    })
    .optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Export validation functions
export const validateUser = (data) => UserSchema.parse(data);
export const validateApp = (data) => AppSchema.parse(data);
export const validateLaunchWeek = (data) => LaunchWeekSchema.parse(data);
export const validateVote = (data) => VoteSchema.parse(data);
export const validateCategory = (data) => CategorySchema.parse(data);
export const validateAnalytics = (data) => AnalyticsSchema.parse(data);
export const validatePayment = (data) => PaymentSchema.parse(data);
export const validateNewsletter = (data) => NewsletterSchema.parse(data);
