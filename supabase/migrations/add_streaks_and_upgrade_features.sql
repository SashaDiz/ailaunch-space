-- ============================================================================
-- Migration: Add Streaks System, Upgrade Features, and Analytics
-- ============================================================================
-- This migration adds:
-- 1. Streaks system fields to users table
-- 2. Upgrade-related fields to apps table
-- 3. New tables: daily_votes, user_rewards, platform_stats
-- 4. vote_weight field to votes table
-- ============================================================================

-- ============================================================================
-- ADD FIELDS TO USERS TABLE
-- ============================================================================

-- Add streak-related fields to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vote_multiplier INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS avatar_border_level INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_vote_date TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add indexes for streak queries
CREATE INDEX IF NOT EXISTS idx_users_current_streak ON public.users(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_users_vote_multiplier ON public.users(vote_multiplier);

-- ============================================================================
-- ADD FIELDS TO APPS TABLE
-- ============================================================================

-- Add upgrade-related fields to apps
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS pending_launch_week TEXT,
  ADD COLUMN IF NOT EXISTS pending_launch_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS pending_weekly_competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pending_launch_month TEXT,
  ADD COLUMN IF NOT EXISTS original_launch_week TEXT,
  ADD COLUMN IF NOT EXISTS original_launch_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS original_weekly_competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS original_launch_month TEXT,
  ADD COLUMN IF NOT EXISTS checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_initiated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS chargeback_dispute_id TEXT,
  ADD COLUMN IF NOT EXISTS chargeback_reason TEXT,
  ADD COLUMN IF NOT EXISTS chargeback_created_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS order_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;

-- Add indexes for upgrade queries
CREATE INDEX IF NOT EXISTS idx_apps_checkout_session_id ON public.apps(checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_apps_order_id ON public.apps(order_id);
CREATE INDEX IF NOT EXISTS idx_apps_payment_status ON public.apps(payment_status);

-- Note: clicks and total_engagement already exist in schema.sql (lines 225-226)

-- ============================================================================
-- ADD FIELD TO VOTES TABLE
-- ============================================================================

-- Add vote_weight field to votes (already exists in schema.sql line 291, but adding IF NOT EXISTS for safety)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'votes' 
    AND column_name = 'vote_weight'
  ) THEN
    ALTER TABLE public.votes ADD COLUMN vote_weight INTEGER DEFAULT 1;
  END IF;
END $$;

-- ============================================================================
-- CREATE DAILY_VOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.daily_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote_date TEXT NOT NULL, -- Format: YYYY-MM-DD
  vote_count INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user per day
  UNIQUE(user_id, vote_date)
);

-- Indexes for daily_votes
CREATE INDEX IF NOT EXISTS idx_daily_votes_user_id ON public.daily_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_votes_vote_date ON public.daily_votes(vote_date);
CREATE INDEX IF NOT EXISTS idx_daily_votes_user_date ON public.daily_votes(user_id, vote_date);

-- Trigger for updated_at
CREATE TRIGGER update_daily_votes_updated_at BEFORE UPDATE ON public.daily_votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS for daily_votes
ALTER TABLE public.daily_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily votes" ON public.daily_votes
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own daily votes" ON public.daily_votes
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own daily votes" ON public.daily_votes
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- CREATE USER_REWARDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Reward details
  reward_type TEXT NOT NULL CHECK (reward_type IN ('power_up', 'discount', 'free_premium')),
  reward_tier INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Stripe integration
  stripe_coupon_id TEXT,
  stripe_promotion_code_id TEXT,
  discount_code TEXT,
  
  -- Usage tracking
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one reward per tier per user
  UNIQUE(user_id, reward_tier)
);

-- Indexes for user_rewards
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON public.user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_reward_tier ON public.user_rewards(reward_tier);
CREATE INDEX IF NOT EXISTS idx_user_rewards_reward_type ON public.user_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_user_rewards_is_used ON public.user_rewards(is_used);

-- Trigger for updated_at
CREATE TRIGGER update_user_rewards_updated_at BEFORE UPDATE ON public.user_rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS for user_rewards
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards" ON public.user_rewards
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own rewards" ON public.user_rewards
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own rewards" ON public.user_rewards
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- CREATE PLATFORM_STATS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_stats (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  visits INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER update_platform_stats_updated_at BEFORE UPDATE ON public.platform_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS for platform_stats (public read, admin write)
ALTER TABLE public.platform_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform stats viewable by everyone" ON public.platform_stats
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify platform stats" ON public.platform_stats
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

-- Insert default stats record if it doesn't exist
INSERT INTO public.platform_stats (id, visits, pageviews)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- UPDATE PAYMENTS TABLE (if needed)
-- ============================================================================

-- Add fields for dispute tracking if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'disputed_at'
  ) THEN
    ALTER TABLE public.payments 
      ADD COLUMN disputed_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN dispute_id TEXT;
  END IF;
END $$;

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Added:';
  RAISE NOTICE '  - Streak fields to users table';
  RAISE NOTICE '  - Upgrade fields to apps table';
  RAISE NOTICE '  - daily_votes table';
  RAISE NOTICE '  - user_rewards table';
  RAISE NOTICE '  - platform_stats table';
  RAISE NOTICE '  - vote_weight to votes table';
END $$;
