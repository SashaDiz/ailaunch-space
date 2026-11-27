-- Badge enforcement no longer waits for the warning email to be delivered.
-- The grace period starts the first time the daily check finds the badge
-- missing; a revoked listing gets its dofollow back once the badge returns.
BEGIN;
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS backlink_missing_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS badge_revoked_at TIMESTAMPTZ;
COMMENT ON COLUMN public.apps.backlink_missing_since IS
  'First check that found the badge missing; dofollow is revoked 7 days later. Reset when the badge returns.';
COMMENT ON COLUMN public.apps.badge_revoked_at IS
  'Dofollow revoked because the badge was removed. The daily check restores dofollow when the badge is back.';
COMMENT ON COLUMN public.apps.backlink_warning_sent_at IS
  'Warning email delivered. Informational only: the grace period runs from backlink_missing_since.';
CREATE INDEX IF NOT EXISTS idx_apps_badge_revoked
  ON public.apps (badge_revoked_at) WHERE badge_revoked_at IS NOT NULL;
COMMIT;
