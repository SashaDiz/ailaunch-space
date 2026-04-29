-- ============================================================================
-- Badge verification + verified_badge dofollow reason
-- ============================================================================
-- Adds tracking columns for badge re-verification and extends the
-- `dofollow_reason` CHECK constraint with `verified_badge` so Standard plan
-- projects can earn dofollow by embedding our badge on their site (admin
-- approval gates the actual link_type flip; cron re-checks weekly).
--
-- Safe to run multiple times.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. New tracking columns on `apps`
-- ---------------------------------------------------------------------------
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS backlink_verified_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS backlink_last_checked_at TIMESTAMP WITH TIME ZONE;

-- ---------------------------------------------------------------------------
-- 2. Extend `dofollow_reason` CHECK constraint with `verified_badge`
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.apps'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%dofollow_reason%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.apps DROP CONSTRAINT %I', constraint_name);
  END IF;

  ALTER TABLE public.apps
    ADD CONSTRAINT apps_dofollow_reason_check
    CHECK (
      dofollow_reason IS NULL
      OR dofollow_reason IN (
        'verified_badge',
        'manual_upgrade',
        'premium_plan',
        'weekly_winner'
      )
    );
END $$;

-- ---------------------------------------------------------------------------
-- 3. Helpful index for the cron re-verifier
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_apps_dofollow_reason_verified_badge
  ON public.apps (dofollow_reason)
  WHERE dofollow_reason = 'verified_badge';

COMMIT;
