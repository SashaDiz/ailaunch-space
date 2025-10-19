-- ============================================================================
-- AI Launch Space - Supabase Database Schema
-- ============================================================================
-- This schema migrates MongoDB collections to PostgreSQL tables
-- Execute this in your Supabase SQL Editor
--
-- PERFORMANCE OPTIMIZATIONS:
-- 1. All auth.uid() calls wrapped in (SELECT auth.uid()) for query plan caching
-- 2. All RLS policies specify TO clause (authenticated/anon) to avoid unnecessary checks
-- 3. Indexes added on all columns used in RLS policy filters
-- 4. SECURITY DEFINER functions used for complex permission checks
-- 5. Composite indexes for multi-column RLS conditions
--
-- SECURITY NOTES:
-- - All tables have Row Level Security (RLS) enabled
-- - Use service_role key for webhook handlers and admin operations that bypass RLS
-- - Never expose service_role key to the client
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Note: Supabase Auth manages auth.users table
-- We extend it with a public.users table for additional profile data

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile information
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  bio TEXT,
  website TEXT,
  twitter TEXT,
  github TEXT,
  linkedin TEXT,
  location TEXT,
  
  -- Platform-specific fields
  total_submissions INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  reputation INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  
  -- Competition stats
  weekly_wins INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_banned BOOLEAN DEFAULT false,
  banned_until TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for users
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);
-- Index for RLS policy performance (critical for auth.uid() lookups)
CREATE INDEX idx_users_id ON public.users(id);

-- ============================================================================
-- CATEGORIES TABLE
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for categories
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_featured ON public.categories(featured);
CREATE INDEX idx_categories_sort_order ON public.categories(sort_order);

-- ============================================================================
-- COMPETITIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id TEXT NOT NULL UNIQUE, -- e.g., "2024-W01"
  type TEXT NOT NULL CHECK (type IN ('weekly')),
  
  -- Timing
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT DEFAULT 'PST',
  
  -- Status
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  
  -- Entries
  total_submissions INTEGER DEFAULT 0, -- Total submissions from both standard and premium
  standard_submissions INTEGER DEFAULT 0, -- Count of standard plan submissions (for analytics)
  premium_submissions INTEGER DEFAULT 0, -- Count of premium plan submissions (for analytics)
  
  -- Limits
  -- Slot System:
  -- - Standard and Premium SHARE the first 15 slots (max_standard_slots)
  -- - Premium gets 10 EXTRA slots beyond the shared slots (total 25 slots for premium)
  -- - Standard can submit: total_submissions < 15
  -- - Premium can submit: total_submissions < 25
  max_standard_slots INTEGER DEFAULT 15, -- Shared slots for both plans
  max_premium_slots INTEGER DEFAULT 25, -- Total slots available for premium (15 shared + 10 extra)
  
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

-- Indexes for competitions
CREATE INDEX idx_competitions_competition_id ON public.competitions(competition_id);
CREATE INDEX idx_competitions_type ON public.competitions(type);
CREATE INDEX idx_competitions_status ON public.competitions(status);
CREATE INDEX idx_competitions_start_date ON public.competitions(start_date);
CREATE INDEX idx_competitions_end_date ON public.competitions(end_date);

-- ============================================================================
-- APPS (PROJECTS) TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Information
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  full_description TEXT,
  
  -- URLs and Media
  website_url TEXT NOT NULL,
  logo_url TEXT,
  screenshots TEXT[],
  video_url TEXT,
  
  -- Categorization
  categories TEXT[] NOT NULL,
  pricing TEXT,
  tags TEXT[],
  
  -- Launch Information
  launch_week TEXT,
  launch_month TEXT,
  launch_date TIMESTAMP WITH TIME ZONE,
  scheduled_launch BOOLEAN DEFAULT false,
  
  -- Contact and Ownership
  contact_email TEXT NOT NULL,
  submitted_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  maker_name TEXT,
  maker_twitter TEXT,
  
  -- Plan and Features
  plan TEXT NOT NULL CHECK (plan IN ('standard', 'premium')),
  plan_price NUMERIC DEFAULT 0,
  backlink_url TEXT,
  backlink_verified BOOLEAN DEFAULT false,
  
  -- Approval system
  approved BOOLEAN DEFAULT false,
  payment_status BOOLEAN DEFAULT false,
  
  -- Link Type Management
  dofollow_status BOOLEAN DEFAULT false,
  link_type TEXT DEFAULT 'nofollow' CHECK (link_type IN ('nofollow', 'dofollow')),
  dofollow_reason TEXT CHECK (dofollow_reason IN ('weekly_winner', 'manual_upgrade', 'premium_plan')),
  dofollow_awarded_at TIMESTAMP WITH TIME ZONE,
  
  -- Premium features
  premium_badge BOOLEAN DEFAULT false,
  skip_queue BOOLEAN DEFAULT false,
  social_promotion BOOLEAN DEFAULT false,
  guaranteed_backlinks INTEGER DEFAULT 0,
  
  -- Status and Moderation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'live', 'archived', 'scheduled', 'draft')),
  is_draft BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  featured BOOLEAN DEFAULT false,
  homepage_featured BOOLEAN DEFAULT false,
  
  -- Competition tracking
  weekly_competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  entered_weekly BOOLEAN DEFAULT true,
  
  -- Engagement Metrics
  views INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  
  -- Ranking and Competition
  -- TODO: Implement advanced ranking system
  -- These columns are ready for future ranking algorithms
  weekly_ranking INTEGER,
  overall_ranking INTEGER,
  ranking_score NUMERIC DEFAULT 0,
  weekly_score NUMERIC DEFAULT 0,
  
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  launched_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for apps
CREATE INDEX idx_apps_slug ON public.apps(slug);
CREATE INDEX idx_apps_status ON public.apps(status);
CREATE INDEX idx_apps_plan ON public.apps(plan);
CREATE INDEX idx_apps_is_draft ON public.apps(is_draft);
CREATE INDEX idx_apps_submitted_by ON public.apps(submitted_by);
CREATE INDEX idx_apps_launch_week ON public.apps(launch_week);
CREATE INDEX idx_apps_launch_month ON public.apps(launch_month);
CREATE INDEX idx_apps_weekly_competition_id ON public.apps(weekly_competition_id);
CREATE INDEX idx_apps_categories ON public.apps USING GIN(categories);
CREATE INDEX idx_apps_created_at ON public.apps(created_at DESC);
CREATE INDEX idx_apps_upvotes ON public.apps(upvotes DESC);
CREATE INDEX idx_apps_weekly_score ON public.apps(weekly_score DESC);
-- Composite index for RLS policy performance (status + submitted_by)
CREATE INDEX idx_apps_status_submitted_by ON public.apps(status, submitted_by);

-- Full-text search index
CREATE INDEX idx_apps_search ON public.apps USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(short_description, '') || ' ' || COALESCE(full_description, ''))
);

-- ============================================================================
-- VOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  
  -- Competition tracking
  weekly_competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  
  -- Vote details
  vote_type TEXT DEFAULT 'upvote' CHECK (vote_type IN ('upvote')),
  vote_weight INTEGER DEFAULT 1,
  
  -- Security
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one vote per user per app
  UNIQUE(user_id, app_id)
);

-- Indexes for votes
CREATE INDEX idx_votes_user_id ON public.votes(user_id) TABLESPACE pg_default;
CREATE INDEX idx_votes_app_id ON public.votes(app_id);
CREATE INDEX idx_votes_weekly_competition_id ON public.votes(weekly_competition_id);
CREATE INDEX idx_votes_created_at ON public.votes(created_at DESC);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES public.apps(id) ON DELETE SET NULL,
  
  -- Payment details
  plan TEXT NOT NULL CHECK (plan IN ('premium')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  payment_id TEXT UNIQUE,
  invoice_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  
  -- Metadata
  metadata JSONB,
  failure_reason TEXT,
  refund_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for payments
CREATE INDEX idx_payments_user_id ON public.payments(user_id) TABLESPACE pg_default;
CREATE INDEX idx_payments_app_id ON public.payments(app_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_payment_id ON public.payments(payment_id);

-- ============================================================================
-- NEWSLETTER TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.newsletter (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  status TEXT DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed', 'pending', 'bounced')),
  
  -- Source tracking
  source TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  
  -- Preferences
  preferences JSONB DEFAULT '{"weekly_digest": true, "new_launches": true, "featured_apps": true, "competition_updates": true, "partner_promotions": false}'::jsonb,
  
  -- Engagement
  last_opened TIMESTAMP WITH TIME ZONE,
  total_opens INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscribed_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for newsletter
CREATE INDEX idx_newsletter_email ON public.newsletter(email);
CREATE INDEX idx_newsletter_status ON public.newsletter(status);

-- ============================================================================
-- SIDEBAR CONTENT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sidebar_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Content details
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('partner', 'guide', 'promotion', 'announcement')),
  
  -- Visual elements
  image_url TEXT,
  logo_url TEXT,
  background_color TEXT,
  text_color TEXT,
  
  -- Links and CTAs
  cta_text TEXT,
  cta_url TEXT,
  external_link BOOLEAN DEFAULT true,
  
  -- Targeting
  position INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Analytics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  
  -- Revenue
  monthly_fee NUMERIC DEFAULT 0,
  revenue_share NUMERIC DEFAULT 0,
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for sidebar_content
CREATE INDEX idx_sidebar_content_active ON public.sidebar_content(active);
CREATE INDEX idx_sidebar_content_position ON public.sidebar_content(position);
CREATE INDEX idx_sidebar_content_content_type ON public.sidebar_content(content_type);
CREATE INDEX idx_sidebar_content_dates ON public.sidebar_content(start_date, end_date);

-- ============================================================================
-- BACKLINKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.backlinks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  
  -- Link details
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  link_type TEXT NOT NULL CHECK (link_type IN ('homepage', 'top3', 'premium')),
  
  -- Status
  active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  last_checked TIMESTAMP WITH TIME ZONE,
  
  -- SEO metrics
  domain_authority INTEGER,
  page_authority INTEGER,
  link_juice NUMERIC DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  removed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for backlinks
CREATE INDEX idx_backlinks_app_id ON public.backlinks(app_id);
CREATE INDEX idx_backlinks_link_type ON public.backlinks(link_type);
CREATE INDEX idx_backlinks_active ON public.backlinks(active);
CREATE INDEX idx_backlinks_verified ON public.backlinks(verified);

-- ============================================================================
-- ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Target tracking
  target_type TEXT NOT NULL CHECK (target_type IN ('app', 'competition', 'sidebar', 'general')),
  target_id UUID,
  
  -- Time tracking
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour <= 23),
  
  -- Metrics
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  time_on_page INTEGER DEFAULT 0,
  
  -- Demographics (stored as JSONB for flexibility)
  referrers JSONB,
  countries JSONB,
  devices JSONB,
  browsers JSONB,
  
  -- Competition specific
  competition_votes INTEGER DEFAULT 0,
  competition_participants INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX idx_analytics_target ON public.analytics(target_type, target_id, date);
CREATE INDEX idx_analytics_date ON public.analytics(date DESC);

-- ============================================================================
-- EXTERNAL WEBHOOKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.external_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id TEXT NOT NULL UNIQUE,
  
  -- Webhook details
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL,
  active BOOLEAN DEFAULT true,
  
  -- Stats
  stats JSONB DEFAULT '{"total_sent": 0, "successful": 0, "failed": 0}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for external_webhooks
CREATE INDEX idx_external_webhooks_active ON public.external_webhooks(active);
CREATE INDEX idx_external_webhooks_events ON public.external_webhooks USING GIN(events);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apps_updated_at BEFORE UPDATE ON public.apps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_updated_at BEFORE UPDATE ON public.newsletter
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sidebar_content_updated_at BEFORE UPDATE ON public.sidebar_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backlinks_updated_at BEFORE UPDATE ON public.backlinks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_webhooks_updated_at BEFORE UPDATE ON public.external_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sidebar_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_webhooks ENABLE ROW LEVEL SECURITY;

-- Users: Users can read their own data, admins can read all
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id OR EXISTS (
    SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Note: User INSERT is handled by Supabase Auth triggers, not direct inserts
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- Categories: Public read, admin write
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify categories" ON public.categories
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

-- Competitions: Public read, admin write
CREATE POLICY "Competitions are viewable by everyone" ON public.competitions
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify competitions" ON public.competitions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

-- Apps: Public read live apps, users can read their own, admin can read all
CREATE POLICY "Live apps are viewable by everyone" ON public.apps
  FOR SELECT
  USING (
    status = 'live' 
    OR status = 'approved'
  );

CREATE POLICY "Users can view own apps" ON public.apps
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = submitted_by);

CREATE POLICY "Admins can view all apps" ON public.apps
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

CREATE POLICY "Users can insert their own apps" ON public.apps
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = submitted_by);

CREATE POLICY "Users can update their own apps" ON public.apps
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = submitted_by);

CREATE POLICY "Admins can update all apps" ON public.apps
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

-- Votes: Users can see their own votes and vote counts
CREATE POLICY "Users can view own votes" ON public.votes
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own votes" ON public.votes
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own votes" ON public.votes
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Payments: Users can see their own payments, admins can see all
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

-- Note: Payment INSERT operations should use service role key from webhook handlers
CREATE POLICY "Only admins can modify payments" ON public.payments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

-- Newsletter: Public insert, admin read/update
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view newsletter" ON public.newsletter
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

-- Sidebar content: Public read active, admin write
CREATE POLICY "Active sidebar content viewable by everyone" ON public.sidebar_content
  FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can view all sidebar content" ON public.sidebar_content
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

CREATE POLICY "Only admins can modify sidebar content" ON public.sidebar_content
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

-- Backlinks: Public read, admin write
CREATE POLICY "Active backlinks viewable by everyone" ON public.backlinks
  FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can view all backlinks" ON public.backlinks
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

CREATE POLICY "Only admins can modify backlinks" ON public.backlinks
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

-- Analytics: Admin only
CREATE POLICY "Only admins can access analytics" ON public.analytics
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

-- External webhooks: Admin only
CREATE POLICY "Only admins can access webhooks" ON public.external_webhooks
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default categories with new structure
INSERT INTO public.categories (name, slug, description, css_class, color, sort_order, featured) VALUES
  -- Business & Finance
  ('Finance & FinTech', 'finance-fintech', 'Financial technology and fintech solutions', 'category-finance', '#10b981', 1, true),
  ('HR & Recruitment', 'hr-recruitment', 'Human resources and recruitment tools', 'category-hr', '#059669', 2, false),
  ('Marketing & Sales', 'marketing-sales', 'Marketing automation and sales tools', 'category-marketing', '#047857', 3, true),
  ('Startup & Small Business', 'startup-small-business', 'Tools for startups and small businesses', 'category-startup', '#065f46', 4, false),
  ('Business Intelligence & Analytics', 'business-intelligence-analytics', 'BI tools and business analytics', 'category-bi', '#064e3b', 5, false),
  ('Customer Service & Support', 'customer-service-support', 'Customer support and service tools', 'category-support', '#022c22', 6, false),
  
  -- Consumer & Lifestyle
  ('Education & Learning', 'education-learning', 'Educational tools and learning platforms', 'category-education', '#3b82f6', 7, true),
  ('Health & Wellness', 'health-wellness', 'Health, fitness and wellness applications', 'category-health', '#2563eb', 8, true),
  ('Productivity', 'productivity', 'Productivity and workflow optimization tools', 'category-productivity', '#1d4ed8', 9, true),
  ('Personal Assistant Tools', 'personal-assistant-tools', 'AI-powered personal assistant applications', 'category-assistant', '#1e40af', 10, false),
  
  -- Content & Creativity
  ('Design & Art', 'design-art', 'Design tools and creative applications', 'category-design', '#ec4899', 11, true),
  ('Video & Content Creation', 'video-content-creation', 'Video editing and content creation tools', 'category-video', '#db2777', 12, true),
  ('Music & Audio', 'music-audio', 'Music production and audio editing tools', 'category-music', '#be185d', 13, false),
  ('Writing & Copywriting', 'writing-copywriting', 'Writing and copywriting assistance tools', 'category-writing', '#9d174d', 14, false),
  ('Image Generation', 'image-generation', 'AI-powered image generation tools', 'category-image-gen', '#831843', 15, true),
  ('Animation & VFX', 'animation-vfx', 'Animation and visual effects software', 'category-animation', '#6b21a8', 16, false),
  
  -- Developer & Tech
  ('Developer Tools', 'developer-tools', 'Development tools and programming resources', 'category-dev', '#8b5cf6', 17, true),
  ('AI & Machine Learning', 'ai-machine-learning', 'AI/ML development and research tools', 'category-ai', '#7c3aed', 18, true),
  ('Data Management', 'data-management', 'Data storage, processing and management tools', 'category-data', '#6d28d9', 19, false),
  ('API & Integration Tools', 'api-integration-tools', 'API development and integration platforms', 'category-api', '#5b21b6', 20, false),
  ('No-Code/Low-Code', 'no-code-low-code', 'No-code and low-code development platforms', 'category-nocode', '#4c1d95', 21, false),
  ('Automation Tools', 'automation-tools', 'Workflow automation and process optimization', 'category-automation', '#3d1a78', 22, false),
  
  -- E-commerce & Retail
  ('E-commerce', 'ecommerce', 'E-commerce platforms and online store tools', 'category-ecommerce', '#f59e0b', 23, true),
  ('Customer Analytics', 'customer-analytics', 'Customer behavior and analytics tools', 'category-customer-analytics', '#d97706', 24, false),
  ('Recommendation Systems', 'recommendation-systems', 'AI-powered recommendation engines', 'category-recommendations', '#b45309', 25, false),
  ('Chatbots & Virtual Assistants', 'chatbots-virtual-assistants', 'Customer service chatbots and virtual assistants', 'category-chatbots', '#92400e', 26, false),
  
  -- Entertainment & Media
  ('Gaming', 'gaming', 'Gaming platforms and game development tools', 'category-gaming', '#ef4444', 27, true),
  ('Social Media Tools', 'social-media-tools', 'Social media management and marketing tools', 'category-social', '#dc2626', 28, false),
  ('Streaming & Podcasting', 'streaming-podcasting', 'Streaming platforms and podcasting tools', 'category-streaming', '#b91c1c', 29, false),
  
  -- Industry-Specific
  ('Healthcare & MedTech', 'healthcare-medtech', 'Healthcare technology and medical applications', 'category-healthcare', '#06b6d4', 30, true),
  ('Legal & Compliance', 'legal-compliance', 'Legal technology and compliance tools', 'category-legal', '#0891b2', 31, false),
  ('Real Estate & PropTech', 'real-estate-proptech', 'Real estate technology and property tools', 'category-realestate', '#0e7490', 32, false),
  ('Research & Academia', 'research-academia', 'Research tools and academic applications', 'category-research', '#155e75', 33, false),
  
  -- Language & Communication
  ('Translation & Localization', 'translation-localization', 'Translation and localization services', 'category-translation', '#f97316', 34, false),
  ('Text Analysis & NLP', 'text-analysis-nlp', 'Natural language processing and text analysis', 'category-nlp', '#ea580c', 35, false),
  ('Voice & Speech', 'voice-speech', 'Voice recognition and speech processing tools', 'category-voice', '#c2410c', 36, false),
  ('Chatbots & Conversational AI', 'chatbots-conversational-ai', 'Conversational AI and chatbot platforms', 'category-conversational', '#9a3412', 37, false),
  
  -- Vision & Recognition
  ('Computer Vision', 'computer-vision', 'Computer vision and image recognition tools', 'category-vision', '#84cc16', 38, false),
  ('Image Recognition', 'image-recognition', 'Image recognition and analysis platforms', 'category-image-recognition', '#65a30d', 39, false),
  ('Video Analysis', 'video-analysis', 'Video analysis and processing tools', 'category-video-analysis', '#4d7c0f', 40, false),
  ('OCR & Document Processing', 'ocr-document-processing', 'Optical character recognition and document processing', 'category-ocr', '#365314', 41, false),
  
  -- Other
  ('Cybersecurity', 'cybersecurity', 'Cybersecurity and security tools', 'category-security', '#6b7280', 42, true),
  ('Sustainability & Impact', 'sustainability-impact', 'Sustainability and social impact tools', 'category-sustainability', '#4b5563', 43, false),
  ('Research Tools', 'research-tools', 'General research and analysis tools', 'category-research-tools', '#374151', 44, false),
  ('General AI Tools', 'general-ai-tools', 'General-purpose AI tools and platforms', 'category-general-ai', '#1f2937', 45, false)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- AUTOMATIC USER CREATION TRIGGER
-- ============================================================================

-- Function to automatically create a user in public.users when they sign up
-- This ensures the foreign key constraint on apps.submitted_by is satisfied
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    full_name,
    first_name,
    role,
    total_submissions,
    total_votes,
    reputation,
    is_active,
    created_at,
    updated_at,
    last_login_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(NEW.email, '@', 1)),
    'user',
    0,
    0,
    0,
    true,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_login_at = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Trigger to call handle_new_user when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- HELPFUL FUNCTIONS
-- ============================================================================

-- Function to check if current user is admin (for RLS performance optimization)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current active weekly competition
CREATE OR REPLACE FUNCTION get_active_weekly_competition()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM public.competitions
    WHERE type = 'weekly'
      AND status = 'active'
      AND start_date <= NOW()
      AND end_date >= NOW()
    ORDER BY start_date DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Function to increment app views
CREATE OR REPLACE FUNCTION increment_app_views(app_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.apps
  SET views = views + 1,
      total_engagement = total_engagement + 1
  WHERE id = app_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to increment app clicks
CREATE OR REPLACE FUNCTION increment_app_clicks(app_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.apps
  SET clicks = clicks + 1,
      total_engagement = total_engagement + 1
  WHERE id = app_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Verify schema
DO $$
BEGIN
  RAISE NOTICE 'Schema created successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify all tables were created';
  RAISE NOTICE '2. Set up authentication in Supabase dashboard';
  RAISE NOTICE '3. Enable email provider in Auth settings';
  RAISE NOTICE '4. Update your application code to use Supabase';
END $$;

