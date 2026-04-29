-- ============================================================================
-- DirectoryKit — Complete Database Schema
-- ============================================================================
-- Single-file schema for setting up the database from scratch.
-- Run this entire file to create all tables, indexes, RLS policies, triggers,
-- functions, and seed data. No migrations needed.
--
-- SETUP FROM SCRATCH
-- ------------------
-- 1. Create a Supabase project at https://supabase.com
-- 2. In the dashboard: Project Settings → API — copy URL, anon key, service_role key
-- 3. Go to SQL Editor → New query
-- 4. Paste this entire file and click "Run"
-- 5. Copy .env.example to .env.local and fill in Supabase credentials
-- 6. Run: pnpm dev
--
-- ALTERNATIVE: Supabase CLI
-- -------------------------
-- If using Supabase CLI locally:
--   supabase init
--   supabase start
--   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/schema.sql
--
-- This script is idempotent — safe to run multiple times (uses IF NOT EXISTS, ON CONFLICT).
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- Trigram text search

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  bio TEXT,
  website TEXT,
  twitter TEXT,
  github TEXT,
  linkedin TEXT,
  location TEXT,
  avatar_url TEXT,

  -- Platform stats
  total_submissions INTEGER DEFAULT 0,
  reputation INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_banned BOOLEAN DEFAULT false,
  banned_until TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT false,

  -- Notification preferences
  notification_preferences JSONB DEFAULT '{"weekly_digest": true, "winner_reminder": true, "account_creation": true, "account_deletion": true, "marketing_emails": true, "submission_decline": true, "competition_winners": true, "submission_approval": true, "weekly_competition_entry": true}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- ============================================================================
-- 2. CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  css_class TEXT,
  app_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  sphere TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_featured ON public.categories(featured);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

-- ============================================================================
-- 3. COMPETITIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('weekly')),

  -- Timing
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT DEFAULT 'UTC',

  -- Status
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),

  -- Entries
  total_submissions INTEGER DEFAULT 0,
  standard_submissions INTEGER DEFAULT 0,
  premium_submissions INTEGER DEFAULT 0,

  -- Slot limits
  max_standard_slots INTEGER DEFAULT 15,
  max_premium_slots INTEGER DEFAULT 10,

  -- Results
  total_votes INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  winner_id UUID,
  runner_up_ids UUID[],
  top_three_ids UUID[],

  -- Metadata
  theme TEXT,
  description TEXT,
  prize_description TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_competitions_competition_id ON public.competitions(competition_id);
CREATE INDEX IF NOT EXISTS idx_competitions_type ON public.competitions(type);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON public.competitions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_start_date ON public.competitions(start_date);
CREATE INDEX IF NOT EXISTS idx_competitions_end_date ON public.competitions(end_date);

-- ============================================================================
-- 4. APPS (PROJECTS) TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic information
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  full_description TEXT,

  -- URLs and media
  website_url TEXT NOT NULL,
  logo_url TEXT,
  screenshots TEXT[],
  video_url TEXT,

  -- Categorisation
  categories TEXT[] NOT NULL,
  pricing TEXT,
  tags TEXT[],

  -- Launch information
  launch_week TEXT,
  launch_month TEXT,
  launch_date TIMESTAMP WITH TIME ZONE,
  scheduled_launch BOOLEAN DEFAULT false,

  -- Contact and ownership
  contact_email TEXT NOT NULL,
  submitted_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  maker_name TEXT,
  maker_twitter TEXT,

  -- Plan and features
  plan TEXT NOT NULL CHECK (plan IN ('standard', 'premium')),
  backlink_url TEXT,
  backlink_verified BOOLEAN DEFAULT false,

  -- Approval system
  approved BOOLEAN DEFAULT false,
  payment_status BOOLEAN DEFAULT false,

  -- Link type management
  dofollow_status BOOLEAN DEFAULT false,
  link_type TEXT DEFAULT 'nofollow' CHECK (link_type IN ('nofollow', 'dofollow')),
  dofollow_reason TEXT CHECK (dofollow_reason IN ('weekly_winner', 'manual_upgrade', 'premium_plan')),
  dofollow_awarded_at TIMESTAMP WITH TIME ZONE,

  -- Premium features
  premium_badge BOOLEAN DEFAULT false,
  skip_queue BOOLEAN DEFAULT false,
  social_promotion BOOLEAN DEFAULT false,
  guaranteed_backlinks INTEGER DEFAULT 0,

  -- Status and moderation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'live', 'archived', 'scheduled', 'draft')),
  is_draft BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  featured BOOLEAN DEFAULT false,

  -- Payment tracking
  checkout_session_id TEXT,
  payment_initiated_at TIMESTAMP WITH TIME ZONE,
  order_id TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,

  -- Competition tracking
  weekly_competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  entered_weekly BOOLEAN DEFAULT true,

  -- Engagement metrics
  views INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,

  -- Ratings and social
  average_rating NUMERIC DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  bookmarks_count INTEGER DEFAULT 0,

  -- Competition results
  weekly_winner BOOLEAN DEFAULT false,
  weekly_position INTEGER,

  -- Homepage presence
  homepage_start_date TIMESTAMP WITH TIME ZONE,
  homepage_end_date TIMESTAMP WITH TIME ZONE,
  homepage_duration INTEGER DEFAULT 7,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apps_slug ON public.apps(slug);
CREATE INDEX IF NOT EXISTS idx_apps_status ON public.apps(status);
CREATE INDEX IF NOT EXISTS idx_apps_plan ON public.apps(plan);
CREATE INDEX IF NOT EXISTS idx_apps_is_draft ON public.apps(is_draft);
CREATE INDEX IF NOT EXISTS idx_apps_submitted_by ON public.apps(submitted_by);
CREATE INDEX IF NOT EXISTS idx_apps_launch_week ON public.apps(launch_week);
CREATE INDEX IF NOT EXISTS idx_apps_launch_month ON public.apps(launch_month);
CREATE INDEX IF NOT EXISTS idx_apps_weekly_competition_id ON public.apps(weekly_competition_id);
CREATE INDEX IF NOT EXISTS idx_apps_categories ON public.apps USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_apps_created_at ON public.apps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apps_upvotes ON public.apps(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_apps_status_submitted_by ON public.apps(status, submitted_by);
CREATE INDEX IF NOT EXISTS idx_apps_average_rating ON public.apps(average_rating DESC);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_apps_search ON public.apps USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(short_description, '') || ' ' || COALESCE(full_description, ''))
);

-- ============================================================================
-- 5. PAYMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES public.apps(id) ON DELETE SET NULL,
  plan TEXT NOT NULL CHECK (plan IN ('premium')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  payment_id TEXT UNIQUE,
  invoice_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  metadata JSONB,
  failure_reason TEXT,
  refund_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_app_id ON public.payments(app_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(payment_id);

-- ============================================================================
-- 7. NEWSLETTER TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.newsletter (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  status TEXT DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed', 'pending', 'bounced')),
  source TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  preferences JSONB DEFAULT '{"weekly_digest": true, "new_launches": true, "featured_apps": true, "competition_updates": true, "partner_promotions": false}'::jsonb,
  last_opened TIMESTAMP WITH TIME ZONE,
  total_opens INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscribed_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON public.newsletter(status);

-- ============================================================================
-- 8. ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type TEXT NOT NULL CHECK (target_type IN ('app', 'competition', 'sidebar', 'general')),
  target_id UUID,
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour <= 23),
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  time_on_page INTEGER DEFAULT 0,
  referrers JSONB,
  countries JSONB,
  devices JSONB,
  browsers JSONB,
  competition_votes INTEGER DEFAULT 0,
  competition_participants INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_target ON public.analytics(target_type, target_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.analytics(date DESC);

-- ============================================================================
-- 9. LINK TYPE CHANGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.link_type_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  from_type TEXT NOT NULL CHECK (from_type IN ('nofollow', 'dofollow')),
  to_type TEXT NOT NULL CHECK (to_type IN ('nofollow', 'dofollow')),
  changed_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_type_changes_project_id ON public.link_type_changes(project_id);
CREATE INDEX IF NOT EXISTS idx_link_type_changes_timestamp ON public.link_type_changes(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_link_type_changes_changed_by ON public.link_type_changes(changed_by);

-- ============================================================================
-- 10. CHANGELOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.changelog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  version TEXT,
  description TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'feature' CHECK (type IN ('feature', 'bugfix', 'improvement', 'breaking', 'announcement')),
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_changelog_published ON public.changelog(published);
CREATE INDEX IF NOT EXISTS idx_changelog_featured ON public.changelog(featured);
CREATE INDEX IF NOT EXISTS idx_changelog_type ON public.changelog(type);
CREATE INDEX IF NOT EXISTS idx_changelog_published_at ON public.changelog(published_at DESC);

-- ============================================================================
-- 11. EMAIL NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN (
    'account_creation', 'account_deletion', 'weekly_competition_entry',
    'submission_received', 'submission_approval', 'submission_decline',
    'launch_week_reminder', 'competition_week_start', 'competition_week_end',
    'competition_winners', 'winner_reminder', 'winner_backlink_reminder',
    'weekly_digest', 'marketing_emails'
  )),
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  resend_email_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_email_type ON public.email_notifications(email_type);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON public.email_notifications(created_at DESC);

-- ============================================================================
-- 12. EXTERNAL WEBHOOKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.external_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL,
  active BOOLEAN DEFAULT true,
  stats JSONB DEFAULT '{"total_sent": 0, "successful": 0, "failed": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_webhooks_active ON public.external_webhooks(active);
CREATE INDEX IF NOT EXISTS idx_external_webhooks_events ON public.external_webhooks USING GIN(events);

-- ============================================================================
-- 13. PARTNERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  logo TEXT NOT NULL,
  website_url TEXT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  checkout_session_id TEXT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'past_due', 'paused')),
  subscription_started_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partners_user_id ON public.partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_status ON public.partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_stripe_subscription_id ON public.partners(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_partners_position ON public.partners(position);

-- ============================================================================
-- 14. SITE SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 15. BOOKMARKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_app_id ON public.bookmarks(app_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at DESC);

-- ============================================================================
-- 16. RATINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_app_id ON public.ratings(app_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON public.ratings(created_at DESC);

-- ============================================================================
-- 17. COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_app_id ON public.comments(app_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- ============================================================================
-- 18. PROMOTIONS TABLE (paid advertising placements)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES public.apps(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT NOT NULL,
  cta_text TEXT DEFAULT NULL,
  placement_banner BOOLEAN DEFAULT false,
  placement_catalog BOOLEAN DEFAULT false,
  placement_detail_page BOOLEAN DEFAULT false,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  checkout_session_id TEXT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'past_due', 'paused', 'rejected')),
  subscription_started_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  admin_notes TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON public.promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_app_id ON public.promotions(app_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON public.promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_stripe_subscription_id ON public.promotions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_promotions_placement_banner ON public.promotions(placement_banner) WHERE placement_banner = true;
CREATE INDEX IF NOT EXISTS idx_promotions_placement_catalog ON public.promotions(placement_catalog) WHERE placement_catalog = true;
CREATE INDEX IF NOT EXISTS idx_promotions_placement_detail_page ON public.promotions(placement_detail_page) WHERE placement_detail_page = true;
CREATE INDEX IF NOT EXISTS idx_promotions_position ON public.promotions(position);

-- ============================================================================
-- TRIGGERS — auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_competitions_updated_at ON public.competitions;
CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_apps_updated_at ON public.apps;
CREATE TRIGGER update_apps_updated_at BEFORE UPDATE ON public.apps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_newsletter_updated_at ON public.newsletter;
CREATE TRIGGER update_newsletter_updated_at BEFORE UPDATE ON public.newsletter
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_changelog_updated_at ON public.changelog;
CREATE TRIGGER update_changelog_updated_at BEFORE UPDATE ON public.changelog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_notifications_updated_at ON public.email_notifications;
CREATE TRIGGER update_email_notifications_updated_at BEFORE UPDATE ON public.email_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_webhooks_updated_at ON public.external_webhooks;
CREATE TRIGGER update_external_webhooks_updated_at BEFORE UPDATE ON public.external_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partners_updated_at ON public.partners;
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promotions_updated_at ON public.promotions;
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ratings_updated_at ON public.ratings;
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_type_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.users FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = id OR EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE TO authenticated
      USING ((SELECT auth.uid()) = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT TO authenticated
      WITH CHECK ((SELECT auth.uid()) = id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Categories — public read, admin write
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='Categories are viewable by everyone') THEN
    CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='Only admins can modify categories') THEN
    CREATE POLICY "Only admins can modify categories" ON public.categories FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Competitions — public read, admin write
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='competitions' AND policyname='Competitions are viewable by everyone') THEN
    CREATE POLICY "Competitions are viewable by everyone" ON public.competitions FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='competitions' AND policyname='Only admins can modify competitions') THEN
    CREATE POLICY "Only admins can modify competitions" ON public.competitions FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Apps — public read (live/approved), owner read/write, admin read/write
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='apps' AND policyname='Live apps are viewable by everyone') THEN
    CREATE POLICY "Live apps are viewable by everyone" ON public.apps FOR SELECT
      USING (status IN ('live', 'approved', 'past'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='apps' AND policyname='Users can view own apps') THEN
    CREATE POLICY "Users can view own apps" ON public.apps FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = submitted_by);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='apps' AND policyname='Admins can view all apps') THEN
    CREATE POLICY "Admins can view all apps" ON public.apps FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='apps' AND policyname='Users can insert their own apps') THEN
    CREATE POLICY "Users can insert their own apps" ON public.apps FOR INSERT TO authenticated
      WITH CHECK ((SELECT auth.uid()) = submitted_by);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='apps' AND policyname='Users can update their own apps') THEN
    CREATE POLICY "Users can update their own apps" ON public.apps FOR UPDATE TO authenticated
      USING ((SELECT auth.uid()) = submitted_by);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='apps' AND policyname='Admins can update all apps') THEN
    CREATE POLICY "Admins can update all apps" ON public.apps FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Payments — owner read, admin all
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payments' AND policyname='Users can view own payments') THEN
    CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payments' AND policyname='Admins can view all payments') THEN
    CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payments' AND policyname='Only admins can modify payments') THEN
    CREATE POLICY "Only admins can modify payments" ON public.payments FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Newsletter — public insert, admin read
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='newsletter' AND policyname='Anyone can subscribe to newsletter') THEN
    CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='newsletter' AND policyname='Only admins can view newsletter') THEN
    CREATE POLICY "Only admins can view newsletter" ON public.newsletter FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Analytics — admin only
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='analytics' AND policyname='Only admins can access analytics') THEN
    CREATE POLICY "Only admins can access analytics" ON public.analytics FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Link type changes — admin only
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='link_type_changes' AND policyname='Only admins can access link type changes') THEN
    CREATE POLICY "Only admins can access link type changes" ON public.link_type_changes FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- External webhooks — admin only
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='external_webhooks' AND policyname='Only admins can access webhooks') THEN
    CREATE POLICY "Only admins can access webhooks" ON public.external_webhooks FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Changelog — public read (published), admin all
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='changelog' AND policyname='Published changelog viewable by everyone') THEN
    CREATE POLICY "Published changelog viewable by everyone" ON public.changelog FOR SELECT USING (published = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='changelog' AND policyname='Admins can view all changelog') THEN
    CREATE POLICY "Admins can view all changelog" ON public.changelog FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='changelog' AND policyname='Only admins can modify changelog') THEN
    CREATE POLICY "Only admins can modify changelog" ON public.changelog FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Email notifications — admin only
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_notifications' AND policyname='Only admins can access email notifications') THEN
    CREATE POLICY "Only admins can access email notifications" ON public.email_notifications FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Partners — public read (active), owner read/write, admin read/write
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='partners' AND policyname='Active partners viewable by everyone') THEN
    CREATE POLICY "Active partners viewable by everyone" ON public.partners FOR SELECT
      USING (status = 'active');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='partners' AND policyname='Users can view own partners') THEN
    CREATE POLICY "Users can view own partners" ON public.partners FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='partners' AND policyname='Users can insert own partners') THEN
    CREATE POLICY "Users can insert own partners" ON public.partners FOR INSERT TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='partners' AND policyname='Users can update own partners') THEN
    CREATE POLICY "Users can update own partners" ON public.partners FOR UPDATE TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='partners' AND policyname='Admins can view all partners') THEN
    CREATE POLICY "Admins can view all partners" ON public.partners FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='partners' AND policyname='Admins can update all partners') THEN
    CREATE POLICY "Admins can update all partners" ON public.partners FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Promotions — public read (active), owner read/write, admin all
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promotions' AND policyname='Active promotions viewable by everyone') THEN
    CREATE POLICY "Active promotions viewable by everyone" ON public.promotions FOR SELECT
      USING (status = 'active');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promotions' AND policyname='Users can view own promotions') THEN
    CREATE POLICY "Users can view own promotions" ON public.promotions FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promotions' AND policyname='Users can insert own promotions') THEN
    CREATE POLICY "Users can insert own promotions" ON public.promotions FOR INSERT TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promotions' AND policyname='Users can update own promotions') THEN
    CREATE POLICY "Users can update own promotions" ON public.promotions FOR UPDATE TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promotions' AND policyname='Admins can view all promotions') THEN
    CREATE POLICY "Admins can view all promotions" ON public.promotions FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promotions' AND policyname='Admins can update all promotions') THEN
    CREATE POLICY "Admins can update all promotions" ON public.promotions FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promotions' AND policyname='Admins can delete all promotions') THEN
    CREATE POLICY "Admins can delete all promotions" ON public.promotions FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Site settings — public read, admin write
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_settings' AND policyname='Site settings are viewable by everyone') THEN
    CREATE POLICY "Site settings are viewable by everyone" ON public.site_settings FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_settings' AND policyname='Only admins can modify site settings') THEN
    CREATE POLICY "Only admins can modify site settings" ON public.site_settings FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND (role = 'admin' OR is_admin = true)))
      WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND (role = 'admin' OR is_admin = true)));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Bookmarks — users manage own
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bookmarks' AND policyname='Users can view own bookmarks') THEN
    CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bookmarks' AND policyname='Users can insert own bookmarks') THEN
    CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks FOR INSERT TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bookmarks' AND policyname='Users can delete own bookmarks') THEN
    CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks FOR DELETE TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Ratings — public read, users manage own
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ratings' AND policyname='Ratings are viewable by everyone') THEN
    CREATE POLICY "Ratings are viewable by everyone" ON public.ratings FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ratings' AND policyname='Users can insert own ratings') THEN
    CREATE POLICY "Users can insert own ratings" ON public.ratings FOR INSERT TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ratings' AND policyname='Users can update own ratings') THEN
    CREATE POLICY "Users can update own ratings" ON public.ratings FOR UPDATE TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Comments — public read, authenticated insert, author/owner/admin delete
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='comments' AND policyname='Comments are viewable by everyone') THEN
    CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='comments' AND policyname='Users can insert own comments') THEN
    CREATE POLICY "Users can insert own comments" ON public.comments FOR INSERT TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='comments' AND policyname='Users can delete own comments') THEN
    CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='comments' AND policyname='Project owners can delete comments on their projects') THEN
    CREATE POLICY "Project owners can delete comments on their projects" ON public.comments FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.apps a WHERE a.id = comments.app_id AND a.submitted_by = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='comments' AND policyname='Admins can delete all comments') THEN
    CREATE POLICY "Admins can delete all comments" ON public.comments FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

-- ============================================================================
-- AUTH TRIGGERS — auto-create user profile on sign-up
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (
    id, full_name, first_name, avatar_url, role,
    total_submissions, reputation,
    is_active, is_admin, notification_preferences,
    created_at, updated_at, last_login_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
    'user', 0, 0, true, false,
    '{"weekly_digest": true, "winner_reminder": true, "account_creation": true, "account_deletion": true, "marketing_emails": true, "submission_decline": true, "competition_winners": true, "submission_approval": true, "weekly_competition_entry": true}'::jsonb,
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    last_login_at = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Sync avatar / name when OAuth metadata changes
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_avatar_url TEXT;
BEGIN
  new_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  UPDATE public.users
  SET
    avatar_url = CASE
      WHEN new_avatar_url IS NOT NULL THEN new_avatar_url
      ELSE public.users.avatar_url
    END,
    full_name = COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      public.users.full_name
    ),
    first_name = COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      public.users.first_name
    ),
    last_login_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_user_update();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Recalculate app average rating from all ratings
CREATE OR REPLACE FUNCTION recalculate_app_rating(target_app_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.apps
  SET
    average_rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.ratings
      WHERE app_id = target_app_id
    ), 0),
    ratings_count = (
      SELECT COUNT(*)::integer
      FROM public.ratings
      WHERE app_id = target_app_id
    )
  WHERE id = target_app_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================
-- Creates the default storage bucket for image uploads (logos, screenshots).
-- The bucket name must match SUPABASE_S3_BUCKET in your .env.local (default: "storage").
-- If this fails, enable Storage in Supabase Dashboard → Storage first.

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('storage', 'storage', true)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Storage schema not ready. Enable Storage in Dashboard → Storage, then run: INSERT INTO storage.buckets (id, name, public) VALUES (''storage'', ''storage'', true) ON CONFLICT (id) DO NOTHING;';
END $$;

-- ============================================================================
-- SEED DATA — starter categories
-- ============================================================================
-- These match config/directory.config.ts seedCategories.
-- Replace or extend them with categories relevant to your directory niche.

INSERT INTO public.categories (name, slug, description, sphere, sort_order) VALUES
  ('SaaS',             'saas',             'Software as a Service products',    'Software', 1),
  ('Developer Tools',  'developer-tools',  'Tools and utilities for developers','Software', 2),
  ('Design',           'design',           'Design tools and resources',        'Creative', 3),
  ('Marketing',        'marketing',        'Marketing and growth tools',        'Business', 4),
  ('Other',            'other',            'Projects that do not fit existing categories', 'Other', 99)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- DONE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'DirectoryKit schema created successfully.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Authentication → Providers: Enable Email (required), Google OAuth (optional)';
  RAISE NOTICE '  2. Storage → Create bucket "storage" if not present (for logos, screenshots)';
  RAISE NOTICE '  3. Copy .env.example to .env.local and add Supabase URL, anon key, service_role key';
  RAISE NOTICE '  4. Run: pnpm dev';
END $$;
