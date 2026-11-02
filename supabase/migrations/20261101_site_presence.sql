-- Live "who's on the site right now" for the catalog block (/api/live-stats).
-- One row per browser tab session, refreshed by the SiteTracker heartbeat
-- (/api/analytics/presence) every ~30s. A session counts as live while
-- last_seen is under five minutes old; rows older than an hour are pruned
-- by the heartbeat itself. Anonymous by design: a random per-tab id, the
-- platform's country code, coordinates rounded to whole degrees, and a
-- public page path — no IP, no user id, no user agent.
BEGIN;
CREATE TABLE IF NOT EXISTS public.site_presence (
  session_id TEXT PRIMARY KEY,
  country TEXT,
  latitude SMALLINT,
  longitude SMALLINT,
  path TEXT,
  path_since TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_site_presence_last_seen ON public.site_presence(last_seen DESC);
-- Service role only (the API routes); no public policies.
ALTER TABLE public.site_presence ENABLE ROW LEVEL SECURITY;
COMMIT;
