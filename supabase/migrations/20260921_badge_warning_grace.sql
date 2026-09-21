-- Apply before deploying the weekly badge warning workflow.
BEGIN;
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS backlink_warning_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS backlink_check_claimed_at TIMESTAMPTZ;
COMMENT ON COLUMN public.apps.backlink_warning_sent_at IS
  'Successful removal-warning email; starts the seven-day badge grace period. Reset when badge returns.';
COMMENT ON COLUMN public.apps.backlink_check_claimed_at IS
  'Temporary cron lease; stale leases expire after 30 minutes.';
COMMIT;
