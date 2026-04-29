-- ============================================================================
-- AI Launch Space — Directory Rewrite Migration
-- ============================================================================
-- Forward-only migration that takes a legacy ailaunchspace database (with
-- voting / streaks / weekly competitions) to the directory-style schema used
-- by the new boilerplate-based codebase.
--
-- The migration is idempotent: every CREATE/ALTER uses IF NOT EXISTS, every
-- INSERT uses ON CONFLICT DO NOTHING, every UPDATE is set-based without
-- side-effects on already-correct rows. Run it as many times as needed on
-- staging before promoting to prod.
--
-- HOW TO APPLY (recommended)
--   1. In Supabase Dashboard → Database → Backups → make a manual backup.
--   2. SQL Editor → paste this entire file → Run.
--   3. Verify counts in `apps`, `users`, `categories`, `payments`, `newsletter`
--      match pre-migration counts.
--   4. After QA on the new app, run the optional CLEANUP block at the bottom
--      manually to drop legacy voting/streak tables.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Required extensions (no-ops if already enabled)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- 1. USERS — add boilerplate-shape columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB
    DEFAULT '{"weekly_digest": true, "marketing_emails": true, "submission_decline": true, "submission_approval": true, "account_creation": true, "account_deletion": true}'::jsonb;

-- Sync legacy `is_admin` boolean → new `role` enum (boilerplate RLS uses role).
UPDATE public.users
SET role = 'admin'
WHERE is_admin = true AND (role IS NULL OR role <> 'admin');

-- ---------------------------------------------------------------------------
-- 2. CATEGORIES — add boilerplate-shape columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS sphere TEXT;

CREATE INDEX IF NOT EXISTS idx_categories_sphere ON public.categories(sphere);

-- ---------------------------------------------------------------------------
-- 3. APPS — add directory-style columns (rating, social, upgrade flag)
-- ---------------------------------------------------------------------------
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS average_rating NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ratings_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bookmarks_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upgrade_pending BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_apps_average_rating ON public.apps(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_apps_ratings_count ON public.apps(ratings_count DESC);

-- Full-text search index used by /api/search and the homepage filter
CREATE INDEX IF NOT EXISTS idx_apps_name_trgm
  ON public.apps USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_apps_short_description_trgm
  ON public.apps USING gin (short_description gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 4. NEW TABLES (boilerplate)
-- ---------------------------------------------------------------------------

-- 4.1 bookmarks
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

-- 4.2 ratings
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

-- 4.3 comments
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

-- 4.4 partners (sponsor program)
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
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'cancelled', 'past_due', 'paused')),
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
CREATE INDEX IF NOT EXISTS idx_partners_position ON public.partners(position);

-- 4.5 promotions (paid ad placements)
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
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'cancelled', 'past_due', 'paused', 'rejected')),
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
CREATE INDEX IF NOT EXISTS idx_promotions_status ON public.promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_placement_banner
  ON public.promotions(placement_banner) WHERE placement_banner = true;
CREATE INDEX IF NOT EXISTS idx_promotions_placement_catalog
  ON public.promotions(placement_catalog) WHERE placement_catalog = true;
CREATE INDEX IF NOT EXISTS idx_promotions_placement_detail_page
  ON public.promotions(placement_detail_page) WHERE placement_detail_page = true;
CREATE INDEX IF NOT EXISTS idx_promotions_position ON public.promotions(position);

-- 4.6 site_settings (admin-controlled theme + feature toggles)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.7 changelog (admin announcements)
CREATE TABLE IF NOT EXISTS public.changelog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  version TEXT,
  description TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'feature'
    CHECK (type IN ('feature', 'bugfix', 'improvement', 'breaking', 'announcement')),
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_changelog_published ON public.changelog(published);
CREATE INDEX IF NOT EXISTS idx_changelog_published_at ON public.changelog(published_at DESC);

-- 4.8 email_notifications (delivery audit log)
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  resend_email_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);

-- ---------------------------------------------------------------------------
-- 5. Migrate legacy `sidebar_content` → `promotions`
-- ---------------------------------------------------------------------------
-- Only sidebar rows of type 'partner' or 'promotion' are advertising slots; we
-- skip 'guide' and 'announcement' entries because they're editorial content.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sidebar_content'
  ) THEN
    INSERT INTO public.promotions (
      id, user_id, name, short_description, logo_url, website_url,
      cta_text, placement_catalog, placement_detail_page, monthly_price,
      status, impressions, clicks, position, created_at, updated_at
    )
    SELECT
      sc.id,
      COALESCE(
        (SELECT id FROM public.users WHERE is_admin = true LIMIT 1),
        (SELECT id FROM public.users LIMIT 1)
      ) AS user_id,
      sc.title AS name,
      COALESCE(sc.description, sc.title) AS short_description,
      COALESCE(sc.logo_url, sc.image_url, '') AS logo_url,
      COALESCE(sc.cta_url, '') AS website_url,
      sc.cta_text,
      true  AS placement_catalog,
      false AS placement_detail_page,
      COALESCE(sc.monthly_fee, 0) AS monthly_price,
      CASE WHEN sc.active THEN 'active' ELSE 'paused' END AS status,
      COALESCE(sc.impressions, 0),
      COALESCE(sc.clicks, 0),
      COALESCE(sc.position, 0),
      sc.created_at,
      sc.updated_at
    FROM public.sidebar_content sc
    WHERE sc.content_type IN ('partner', 'promotion')
      AND COALESCE(sc.cta_url, '') <> ''
      AND COALESCE(sc.logo_url, sc.image_url, '') <> ''
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6. Backfill rating / comment / bookmark counts on apps from existing rows
--    (counts are 0 right after fresh table creation; this query is a no-op
--     unless the migration runs again later when data has been written.)
-- ---------------------------------------------------------------------------
UPDATE public.apps a SET
  ratings_count = COALESCE(r.cnt, 0),
  average_rating = COALESCE(r.avg, 0)
FROM (
  SELECT app_id, COUNT(*)::INT AS cnt, AVG(rating)::NUMERIC(3,2) AS avg
  FROM public.ratings GROUP BY app_id
) r
WHERE a.id = r.app_id;

UPDATE public.apps a SET comments_count = COALESCE(c.cnt, 0)
FROM (SELECT app_id, COUNT(*)::INT AS cnt FROM public.comments GROUP BY app_id) c
WHERE a.id = c.app_id;

UPDATE public.apps a SET bookmarks_count = COALESCE(b.cnt, 0)
FROM (SELECT app_id, COUNT(*)::INT AS cnt FROM public.bookmarks GROUP BY app_id) b
WHERE a.id = b.app_id;

-- ---------------------------------------------------------------------------
-- 7. RLS — enable + policies for new tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.bookmarks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.changelog       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- bookmarks: each user sees / writes their own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bookmarks' AND policyname='Users manage own bookmarks') THEN
    CREATE POLICY "Users manage own bookmarks" ON public.bookmarks FOR ALL
      TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ratings: public read, owner write
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ratings' AND policyname='Ratings are viewable by everyone') THEN
    CREATE POLICY "Ratings are viewable by everyone" ON public.ratings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ratings' AND policyname='Users manage own ratings') THEN
    CREATE POLICY "Users manage own ratings" ON public.ratings FOR ALL
      TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- comments: public read, owner write, admin moderate (via service role)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='comments' AND policyname='Comments are viewable by everyone') THEN
    CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='comments' AND policyname='Users manage own comments') THEN
    CREATE POLICY "Users manage own comments" ON public.comments FOR ALL
      TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- partners / promotions: active rows publicly readable, owner can write own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='partners' AND policyname='Active partners viewable by everyone') THEN
    CREATE POLICY "Active partners viewable by everyone" ON public.partners FOR SELECT USING (status = 'active');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='partners' AND policyname='Users manage own partners') THEN
    CREATE POLICY "Users manage own partners" ON public.partners FOR ALL
      TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='promotions' AND policyname='Active promotions viewable by everyone') THEN
    CREATE POLICY "Active promotions viewable by everyone" ON public.promotions FOR SELECT USING (status = 'active');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='promotions' AND policyname='Users manage own promotions') THEN
    CREATE POLICY "Users manage own promotions" ON public.promotions FOR ALL
      TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- changelog: published rows public, drafts admin-only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='changelog' AND policyname='Published changelog viewable by everyone') THEN
    CREATE POLICY "Published changelog viewable by everyone" ON public.changelog FOR SELECT USING (published = true);
  END IF;
END $$;

-- site_settings & email_notifications: admin-only via service role (no public policy needed)

-- ---------------------------------------------------------------------------
-- 8. Triggers — keep `apps` aggregate counts in sync with ratings/comments/bookmarks
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_app_rating_aggregates(p_app_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.apps SET
    ratings_count = (SELECT COUNT(*) FROM public.ratings WHERE app_id = p_app_id),
    average_rating = COALESCE(
      (SELECT AVG(rating)::NUMERIC(3,2) FROM public.ratings WHERE app_id = p_app_id),
      0
    )
  WHERE id = p_app_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_ratings_aggregates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.refresh_app_rating_aggregates(COALESCE(NEW.app_id, OLD.app_id));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_ratings_aggregates ON public.ratings;
CREATE TRIGGER trg_ratings_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.tg_ratings_aggregates();

CREATE OR REPLACE FUNCTION public.tg_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_id UUID := COALESCE(NEW.app_id, OLD.app_id);
BEGIN
  UPDATE public.apps
     SET comments_count = (SELECT COUNT(*) FROM public.comments WHERE app_id = target_id)
   WHERE id = target_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_comments_count ON public.comments;
CREATE TRIGGER trg_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.tg_comments_count();

CREATE OR REPLACE FUNCTION public.tg_bookmarks_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_id UUID := COALESCE(NEW.app_id, OLD.app_id);
BEGIN
  UPDATE public.apps
     SET bookmarks_count = (SELECT COUNT(*) FROM public.bookmarks WHERE app_id = target_id)
   WHERE id = target_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookmarks_count ON public.bookmarks;
CREATE TRIGGER trg_bookmarks_count
  AFTER INSERT OR DELETE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.tg_bookmarks_count();

COMMIT;

-- ============================================================================
-- OPTIONAL CLEANUP (run manually after the new app is verified on prod)
-- ============================================================================
-- These DROPs remove the legacy voting/streak/competition tables and columns.
-- Once dropped, you cannot roll back code changes that referenced them, so
-- only run this block AFTER:
--   - the directory-rewrite branch is merged & deployed,
--   - smoke tests pass,
--   - `sidebar_content` rows have been migrated and verified in `promotions`.
--
-- BEGIN;
--
-- DROP TABLE IF EXISTS public.votes CASCADE;
-- DROP TABLE IF EXISTS public.daily_votes CASCADE;
-- DROP TABLE IF EXISTS public.user_rewards CASCADE;
-- DROP TABLE IF EXISTS public.platform_stats CASCADE;
-- DROP TABLE IF EXISTS public.sidebar_content CASCADE;
--
-- ALTER TABLE public.users
--   DROP COLUMN IF EXISTS current_streak,
--   DROP COLUMN IF EXISTS longest_streak,
--   DROP COLUMN IF EXISTS vote_multiplier,
--   DROP COLUMN IF EXISTS avatar_border_level,
--   DROP COLUMN IF EXISTS last_vote_date,
--   DROP COLUMN IF EXISTS total_votes,
--   DROP COLUMN IF EXISTS weekly_wins,
--   DROP COLUMN IF EXISTS total_wins;
--
-- -- Apps table: keep the dofollow_* and premium_* columns — they're still used by
-- -- the directory's backlink-management feature. Only drop pure-competition fields:
-- ALTER TABLE public.apps
--   DROP COLUMN IF EXISTS pending_launch_week,
--   DROP COLUMN IF EXISTS pending_launch_date,
--   DROP COLUMN IF EXISTS pending_weekly_competition_id,
--   DROP COLUMN IF EXISTS pending_launch_month,
--   DROP COLUMN IF EXISTS original_launch_week,
--   DROP COLUMN IF EXISTS original_launch_date,
--   DROP COLUMN IF EXISTS original_weekly_competition_id,
--   DROP COLUMN IF EXISTS original_launch_month,
--   DROP COLUMN IF EXISTS weekly_ranking,
--   DROP COLUMN IF EXISTS overall_ranking,
--   DROP COLUMN IF EXISTS ranking_score,
--   DROP COLUMN IF EXISTS weekly_score,
--   DROP COLUMN IF EXISTS chargeback_dispute_id,
--   DROP COLUMN IF EXISTS chargeback_reason,
--   DROP COLUMN IF EXISTS chargeback_created_at;
--
-- -- The `competitions` table is still referenced by `apps.weekly_competition_id`
-- -- and `email_notifications.competition_id` — drop the FKs first if you really
-- -- want to remove it:
-- -- ALTER TABLE public.apps DROP COLUMN IF EXISTS weekly_competition_id;
-- -- ALTER TABLE public.apps DROP COLUMN IF EXISTS entered_weekly;
-- -- ALTER TABLE public.apps DROP COLUMN IF EXISTS weekly_winner;
-- -- ALTER TABLE public.apps DROP COLUMN IF EXISTS weekly_position;
-- -- DROP TABLE IF EXISTS public.competitions CASCADE;
--
-- COMMIT;
