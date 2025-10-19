import { z } from "zod";

// User Schema (Auth.js compatible)
export const UserSchema = z.object({
  // Auth.js fields
  id: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email(),
  image: z.string().url().optional(),
  emailVerified: z.date().optional(),
  
  // Profile information
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  location: z.string().optional(),
  
  // Platform-specific fields
  totalSubmissions: z.number().default(0),
  totalVotes: z.number().default(0),
  reputation: z.number().default(0),
  role: z.enum(["user", "admin", "moderator"]).default("user"),
  
  // Competition stats
  weeklyWins: z.number().default(0),
  totalWins: z.number().default(0),
  
  // Status
  isActive: z.boolean().default(true),
  isBanned: z.boolean().default(false),
  bannedUntil: z.date().optional(),
  deletedAt: z.date().optional(),
  
  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  lastLoginAt: z.date().optional(),
});

// Project/App Schema
export const AppSchema = z.object({
  id: z.string().optional(),
  
  // Basic Information
  name: z.string().min(1, "Project name is required").max(100),
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
  launch_month: z.string(), // Format: "2024-01"
  launch_date: z.date(),

  // Contact and Ownership
  contact_email: z.string().email(), // Will be populated from user account
  submitted_by: z.string(), // User ID
  maker_name: z.string().optional(), // Will be populated from user account
  maker_twitter: z.string().optional(),

  // Plan and Features (Updated pricing)
  plan: z.enum(["standard", "premium"]),
  plan_price: z.number().default(0), // $0 for standard, $15 for premium
  backlink_url: z.string().url().optional(),
  backlink_verified: z.boolean().default(false),
  
  // Approval system (as per CLAUDE.md spec)
  approved: z.boolean().default(false),
  payment_status: z.boolean().default(false),
  
  // Link Type Management
  // Standard Launch (FREE): 
  //   - 15 slots per week
  //   - nofollow by default
  //   - can earn dofollow + badge if wins top 3 in weekly competition
  // Premium Launch ($15):
  //   - 10 dedicated slots per week
  //   - guaranteed dofollow backlinks by default
  //   - both plans can earn badges for top 3 ranking
  dofollow_status: z.boolean().default(false),
  link_type: z.enum(["nofollow", "dofollow"]).default("nofollow"),
  dofollow_reason: z.enum(["weekly_winner", "manual_upgrade", "premium_plan"]).optional(),
  dofollow_awarded_at: z.date().optional(), // When dofollow was granted
  
  // Premium features
  premium_badge: z.boolean().default(false),
  skip_queue: z.boolean().default(false),
  social_promotion: z.boolean().default(false),
  guaranteed_backlinks: z.number().default(0),

  // Status and Moderation
  status: z
    .enum(["pending", "approved", "rejected", "live", "archived"])
    .default("pending"),
  rejection_reason: z.string().optional(),
  featured: z.boolean().default(false),
  homepage_featured: z.boolean().default(false),

  // Competition tracking
  weekly_competition_id: z.string().optional(),
  entered_weekly: z.boolean().default(true),

  // Engagement Metrics
  views: z.number().default(0),
  upvotes: z.number().default(0),
  clicks: z.number().default(0),
  total_engagement: z.number().default(0),

  // Ranking and Competition
  // TODO: Implement ranking system
  // - weekly_ranking: Position in weekly competition (1, 2, 3, etc.)
  // - overall_ranking: Position across all projects on platform
  // - ranking_score: Calculated score for overall rankings
  // - weekly_score: Calculated score for weekly competition
  weekly_ranking: z.number().optional(),
  overall_ranking: z.number().optional(),
  ranking_score: z.number().default(0),
  weekly_score: z.number().default(0),
  
  // Competition results
  weekly_winner: z.boolean().default(false),
  weekly_position: z.number().optional(), // 1, 2, 3 for top 3

  // Homepage presence
  // Standard (FREE) plan: 7 days on homepage
  // Premium plan: Can be extended or featured longer
  homepage_start_date: z.date().optional(),
  homepage_end_date: z.date().optional(),
  homepage_duration: z.number().default(7), // days - standard plan gets 7 days

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  publishedAt: z.date().optional(),
  launchedAt: z.date().optional(),

  // SEO
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
});

// Project Submission Validation Schemas
export const ProjectSubmissionSchema = z.object({
  // Step 1: Plan Selection
  plan: z.enum(["standard", "premium"], {
    required_error: "Please select a plan",
  }),

  // Step 2: Basic Info
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be 100 characters or less"),
  website_url: z.string().url("Please enter a valid website URL"),
  short_description: z
    .string()
    .min(1, "Short description is required")
    .max(160, "Short description must be 160 characters or less"),
  maker_twitter: z
    .string()
    .regex(/^@?[A-Za-z0-9_]+$/, "Invalid Twitter handle")
    .optional()
    .or(z.literal("")),

  // Step 3: Details
  full_description: z.string().optional(),
  categories: z
    .array(z.string())
    .min(1, "Please select at least one category")
    .max(3, "You can select up to 3 categories"),
  pricing: z
    .enum(["Free", "Freemium", "Paid"])
    .optional(),
  video_url: z.string().url("Please enter a valid video URL").optional().or(z.literal("")),

  // Step 4: Media
  logo_url: z.string().url("Please enter a valid logo URL"),
  screenshots: z.array(z.string().url()).max(5, "Maximum 5 screenshots allowed").optional(),

  // Step 5: Launch Week
  launch_week: z.string().min(1, "Please select a launch week"),

  // Premium plan specific
  backlink_url: z.string().url().optional().or(z.literal("")),
});

// Validation schema for individual steps
export const PlanSelectionSchema = ProjectSubmissionSchema.pick({
  plan: true,
});

export const BasicInfoSchema = ProjectSubmissionSchema.pick({
  name: true,
  website_url: true,
  short_description: true,
  maker_twitter: true,
});

export const DetailsSchema = ProjectSubmissionSchema.pick({
  full_description: true,
  categories: true,
  pricing: true,
  video_url: true,
});

export const MediaSchema = ProjectSubmissionSchema.pick({
  logo_url: true,
  screenshots: true,
});

export const LaunchWeekSchema = ProjectSubmissionSchema.pick({
  launch_week: true,
});

// Competition Schema (for weekly only)
// Weekly competitions determine which FREE plan submissions get dofollow links
// Top 3 winners receive dofollow links as reward
export const CompetitionSchema = z.object({
  id: z.string().optional(),
  competition_id: z.string(), // e.g., "2024-W01"
  type: z.enum(["weekly"]),
  
  // Timing
  start_date: z.date(),
  end_date: z.date(),
  timezone: z.string().default("PST"),
  
  // Status
  status: z.enum(["upcoming", "active", "completed", "cancelled"]),
  
  // Entries
  total_submissions: z.number().default(0),
  standard_submissions: z.number().default(0),
  premium_submissions: z.number().default(0),
  
  // Limits
  // Standard Launch (FREE): 15 slots per week, nofollow by default, top 3 winners get dofollow + badge
  // Premium Launch ($15): 10 slots per week, guaranteed dofollow backlinks by default, can also earn badges
  max_standard_slots: z.number().default(15),
  max_premium_slots: z.number().default(10),
  
  // Results
  // Top 3 winners get dofollow links automatically
  total_votes: z.number().default(0),
  total_participants: z.number().default(0),
  winner_id: z.string().optional(), // 1st place
  runner_up_ids: z.array(z.string()).default([]), // 2nd and 3rd place
  top_three_ids: z.array(z.string()).default([]), // All top 3 for easy access
  
  // Metadata
  theme: z.string().optional(),
  description: z.string().optional(),
  prize_description: z.string().optional(),
  
  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  completedAt: z.date().optional(),
});

// Vote Schema
export const VoteSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  app_id: z.string(),
  
  // Competition tracking
  weekly_competition_id: z.string().optional(),
  
  // Vote details
  vote_type: z.enum(["upvote"]), // Only upvotes allowed
  vote_weight: z.number().default(1), // Future feature for weighted votes
  
  // Security
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  
  // Timestamps
  createdAt: z.date().default(() => new Date()),
});

// Category Schema (Enhanced with colors)
export const CategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(50),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().max(200).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  css_class: z.string().optional(), // e.g., "category-ai"
  app_count: z.number().default(0),
  featured: z.boolean().default(false),
  sort_order: z.number().default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Sidebar Promotional Content Schema
export const SidebarContentSchema = z.object({
  id: z.string().optional(),
  
  // Content details
  title: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  content_type: z.enum(["partner", "guide", "promotion", "announcement"]),
  
  // Visual elements
  image_url: z.string().url().optional(),
  logo_url: z.string().url().optional(),
  background_color: z.string().optional(),
  text_color: z.string().optional(),
  
  // Links and CTAs
  cta_text: z.string().max(50).optional(),
  cta_url: z.string().url().optional(),
  external_link: z.boolean().default(true),
  
  // Targeting
  position: z.number().default(0), // Display order
  active: z.boolean().default(true),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  
  // Analytics
  impressions: z.number().default(0),
  clicks: z.number().default(0),
  ctr: z.number().default(0),
  
  // Revenue (for partners)
  monthly_fee: z.number().default(0),
  revenue_share: z.number().default(0),
  
  // Metadata
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  
  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Analytics Schema (Enhanced)
export const AnalyticsSchema = z.object({
  id: z.string().optional(),
  
  // Target tracking
  target_type: z.enum(["app", "competition", "sidebar", "general"]),
  target_id: z.string().optional(), // App ID, Competition ID, etc.
  
  // Time tracking
  date: z.date(),
  hour: z.number().min(0).max(23).optional(),
  
  // Metrics
  views: z.number().default(0),
  clicks: z.number().default(0),
  upvotes: z.number().default(0),
  unique_visitors: z.number().default(0),
  bounce_rate: z.number().default(0),
  time_on_page: z.number().default(0), // seconds
  
  // Demographics
  referrers: z.record(z.number()).optional(),
  countries: z.record(z.number()).optional(),
  devices: z.record(z.number()).optional(),
  browsers: z.record(z.number()).optional(),
  
  // Competition specific
  competition_votes: z.number().default(0),
  competition_participants: z.number().default(0),
  
  createdAt: z.date().default(() => new Date()),
});

// Payment Schema (Updated for new pricing)
export const PaymentSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  app_id: z.string().optional(),
  
  // Payment details
  plan: z.enum(["premium"]), // Only premium plan requires payment
  amount: z.number().positive(), // $15 for premium
  currency: z.string().default("USD"),
  payment_method: z.string(), // stripe, paypal, etc.
  payment_id: z.string(), // External payment ID
  invoice_id: z.string().optional(),
  
  // Status
  status: z.enum(["pending", "completed", "failed", "refunded", "cancelled"]),
  
  // Metadata
  metadata: z.record(z.any()).optional(),
  failure_reason: z.string().optional(),
  refund_reason: z.string().optional(),
  
  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  paidAt: z.date().optional(),
  refundedAt: z.date().optional(),
});

// Newsletter Subscription Schema (Enhanced)
export const NewsletterSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string().optional(),
  status: z.enum(["subscribed", "unsubscribed", "pending", "bounced"]),
  
  // Source tracking
  source: z.string().optional(),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
  
  // Preferences
  preferences: z
    .object({
      weekly_digest: z.boolean().default(true),
      new_launches: z.boolean().default(true),
      featured_apps: z.boolean().default(true),
      competition_updates: z.boolean().default(true),
      partner_promotions: z.boolean().default(false),
    })
    .optional(),
  
  // Engagement
  last_opened: z.date().optional(),
  total_opens: z.number().default(0),
  total_clicks: z.number().default(0),
  
  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  subscribedAt: z.date().optional(),
  unsubscribedAt: z.date().optional(),
});

// Backlink Schema (for tracking project backlinks)
export const BacklinkSchema = z.object({
  id: z.string().optional(),
  app_id: z.string(),
  
  // Link details
  source_url: z.string().url(), // AI Launch Space URL
  target_url: z.string().url(), // Project's URL
  anchor_text: z.string().optional(),
  link_type: z.enum(["homepage", "top3", "premium"]),
  
  // Status
  active: z.boolean().default(true),
  verified: z.boolean().default(false),
  last_checked: z.date().optional(),
  
  // SEO metrics
  domain_authority: z.number().optional(),
  page_authority: z.number().optional(),
  link_juice: z.number().default(1),
  
  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  removedAt: z.date().optional(),
});

// Export validation functions
export const validateUser = (data) => UserSchema.parse(data);
export const validateApp = (data) => AppSchema.parse(data);
export const validateCompetition = (data) => CompetitionSchema.parse(data);
export const validateVote = (data) => VoteSchema.parse(data);
export const validateCategory = (data) => CategorySchema.parse(data);
export const validateSidebarContent = (data) => SidebarContentSchema.parse(data);
export const validateAnalytics = (data) => AnalyticsSchema.parse(data);
export const validatePayment = (data) => PaymentSchema.parse(data);
export const validateNewsletter = (data) => NewsletterSchema.parse(data);
export const validateBacklink = (data) => BacklinkSchema.parse(data);
