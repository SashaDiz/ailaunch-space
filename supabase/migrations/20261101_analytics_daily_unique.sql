-- One analytics row per (target_type, target_id, date), written atomically.
--
-- /api/analytics/track used to look up today's row with .maybeSingle() and
-- insert a new one when nothing came back. Two concurrent first pageviews of
-- a day both inserted; from then on .maybeSingle() errored on every lookup,
-- so every later pageview inserted yet another row (some days hold hundreds).
--
-- This migration
--   1. merges the existing duplicates into one row per day,
--   2. adds a unique index so a second row can never be inserted again,
--   3. adds track_analytics_pageview() / add_analytics_time_on_page(), which
--      the tracker now calls instead of read-modify-write from Node.
--
-- `hour` is only ever stamped with the insert hour by the tracker and is read
-- by nothing, so the index covers every row regardless of hour. Making it
-- partial (WHERE hour IS NULL) would let the still-deployed old tracker,
-- which inserts with an hour, create a duplicate between running this and
-- deploying the new code.
--
-- Run in the Supabase SQL Editor BEFORE deploying the tracker change.

-- The Supabase SQL Editor runs each statement in its own transaction and
-- ignores BEGIN/COMMIT, so the whole merge + index build is ONE DO block:
-- a single statement is a single transaction, the lock is held until the
-- unique index exists, and a failure part-way rolls everything back (no
-- half-applied UPDATE without the matching DELETE). BEGIN/COMMIT stay for
-- psql, where they are harmless.

BEGIN;

-- Sum the numeric values of a set of flat {key: count} JSONB maps. Only used
-- by the merge below; dropped again at the end of this migration.
CREATE OR REPLACE FUNCTION public.analytics_sum_count_maps(maps JSONB[])
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT COALESCE(jsonb_object_agg(key, total), '{}'::jsonb)
  FROM (
    SELECT e.key, SUM((e.value)::text::numeric) AS total
    FROM unnest(maps) AS m(map)
    CROSS JOIN LATERAL jsonb_each(
      CASE WHEN jsonb_typeof(m.map) = 'object' THEN m.map ELSE '{}'::jsonb END
    ) AS e
    WHERE jsonb_typeof(e.value) = 'number'
    GROUP BY e.key
  ) s;
$$;

DO $merge$
BEGIN
  -- Block tracker writes until the unique index exists so no new duplicate
  -- slips in between the merge and the index build. Reads are unaffected.
  LOCK TABLE public.analytics IN SHARE ROW EXCLUSIVE MODE;

  CREATE TEMP TABLE analytics_merged AS
  SELECT
    a.target_type,
    a.target_id,
    a.date,
    (array_agg(a.id ORDER BY a.created_at, a.id))[1] AS keep_id,
    SUM(COALESCE(a.views, 0))::int AS views,
    SUM(COALESCE(a.clicks, 0))::int AS clicks,
    SUM(COALESCE(a.upvotes, 0))::int AS upvotes,
    SUM(COALESCE(a.time_on_page, 0))::int AS time_on_page,
    SUM(COALESCE(a.competition_votes, 0))::int AS competition_votes,
    SUM(COALESCE(a.competition_participants, 0))::int AS competition_participants,
    SUM(COALESCE(a.unique_visitors, 0))::int AS sum_unique_visitors,
    MAX(COALESCE(a.unique_visitors, 0))::int AS max_unique_visitors,
    public.analytics_sum_count_maps(array_agg(a.referrers -> 'sources')) AS referrer_sources,
    public.analytics_sum_count_maps(array_agg(a.countries)) AS countries,
    public.analytics_sum_count_maps(array_agg(a.devices)) AS devices,
    public.analytics_sum_count_maps(array_agg(a.browsers)) AS browsers
  FROM public.analytics a
  GROUP BY a.target_type, a.target_id, a.date
  HAVING COUNT(*) > 1;

  -- Visitor hashes are sha256(ip:date), so the same hash in two rows of one
  -- day is the same visitor. Each duplicate row was inserted with
  -- unique_visitors = 1 for its own hash; summing would count a returning
  -- visitor once per row.
  CREATE TEMP TABLE analytics_merged_hashes AS
  SELECT
    m.keep_id,
    COALESCE(jsonb_agg(DISTINCT h.hash), '[]'::jsonb) AS visitor_hashes,
    COUNT(DISTINCT h.hash)::int AS distinct_hashes
  FROM analytics_merged m
  JOIN public.analytics a
    ON a.target_type = m.target_type
   AND a.target_id IS NOT DISTINCT FROM m.target_id
   AND a.date = m.date
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(a.referrers -> 'visitor_hashes') = 'array'
         THEN a.referrers -> 'visitor_hashes' ELSE '[]'::jsonb END
  ) AS h(hash)
  GROUP BY m.keep_id;

  UPDATE public.analytics a
  SET
    views = m.views,
    clicks = m.clicks,
    upvotes = m.upvotes,
    time_on_page = m.time_on_page,
    competition_votes = m.competition_votes,
    competition_participants = m.competition_participants,
    unique_visitors = CASE
      WHEN COALESCE(h.distinct_hashes, 0) > 0
        THEN GREATEST(h.distinct_hashes, m.max_unique_visitors)
      ELSE m.sum_unique_visitors
    END,
    referrers = jsonb_build_object(
      'visitor_hashes', COALESCE(h.visitor_hashes, '[]'::jsonb),
      'sources', m.referrer_sources
    ),
    countries = m.countries,
    devices = m.devices,
    browsers = m.browsers
  FROM analytics_merged m
  LEFT JOIN analytics_merged_hashes h ON h.keep_id = m.keep_id
  WHERE a.id = m.keep_id;

  DELETE FROM public.analytics a
  USING analytics_merged m
  WHERE a.target_type = m.target_type
    AND a.target_id IS NOT DISTINCT FROM m.target_id
    AND a.date = m.date
    AND a.id <> m.keep_id;

  CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_target_date_unique
    ON public.analytics(target_type, target_id, date);

  -- The unique index serves every lookup the old one did.
  DROP INDEX IF EXISTS public.idx_analytics_target;

  DROP TABLE analytics_merged;
  DROP TABLE analytics_merged_hashes;
END
$merge$;

DROP FUNCTION IF EXISTS public.analytics_sum_count_maps(JSONB[]);

-- Count one pageview: create today's row or increment it, in one statement.
-- ON CONFLICT DO UPDATE locks the row, so concurrent calls serialise and every
-- increment lands; the JSONB counters are computed from the locked row.
CREATE OR REPLACE FUNCTION public.track_analytics_pageview(
  p_target_type TEXT,
  p_target_id UUID,
  p_date DATE,
  p_visitor_hash TEXT,
  p_referrer_host TEXT,
  p_device TEXT,
  p_browser TEXT,
  p_country TEXT
)
RETURNS VOID
LANGUAGE sql
SET search_path = ''
AS $$
  INSERT INTO public.analytics AS a (
    target_type, target_id, date, hour, views, unique_visitors,
    referrers, devices, browsers, countries
  )
  VALUES (
    p_target_type,
    p_target_id,
    p_date,
    EXTRACT(HOUR FROM NOW() AT TIME ZONE 'UTC')::int,
    1,
    1,
    jsonb_build_object(
      'visitor_hashes', jsonb_build_array(p_visitor_hash),
      'sources', CASE WHEN p_referrer_host IS NULL THEN '{}'::jsonb
                      ELSE jsonb_build_object(p_referrer_host, 1) END
    ),
    jsonb_build_object(p_device, 1),
    jsonb_build_object(p_browser, 1),
    jsonb_build_object(p_country, 1)
  )
  ON CONFLICT (target_type, target_id, date) DO UPDATE SET
    views = COALESCE(a.views, 0) + 1,
    unique_visitors = COALESCE(a.unique_visitors, 0)
      + CASE WHEN COALESCE(a.referrers -> 'visitor_hashes', '[]'::jsonb) ? p_visitor_hash
             THEN 0 ELSE 1 END,
    referrers = jsonb_build_object(
      'visitor_hashes',
        CASE WHEN COALESCE(a.referrers -> 'visitor_hashes', '[]'::jsonb) ? p_visitor_hash
             THEN a.referrers -> 'visitor_hashes'
             ELSE COALESCE(a.referrers -> 'visitor_hashes', '[]'::jsonb)
                  || jsonb_build_array(p_visitor_hash) END,
      'sources',
        CASE WHEN p_referrer_host IS NULL
             THEN COALESCE(a.referrers -> 'sources', '{}'::jsonb)
             ELSE COALESCE(a.referrers -> 'sources', '{}'::jsonb)
                  || jsonb_build_object(
                       p_referrer_host,
                       COALESCE((a.referrers -> 'sources' ->> p_referrer_host)::int, 0) + 1
                     ) END
    ),
    devices = COALESCE(a.devices, '{}'::jsonb)
      || jsonb_build_object(p_device, COALESCE((a.devices ->> p_device)::int, 0) + 1),
    browsers = COALESCE(a.browsers, '{}'::jsonb)
      || jsonb_build_object(p_browser, COALESCE((a.browsers ->> p_browser)::int, 0) + 1),
    countries = COALESCE(a.countries, '{}'::jsonb)
      || jsonb_build_object(p_country, COALESCE((a.countries ->> p_country)::int, 0) + 1);
$$;

-- Add seconds to today's row. Like the old tracker, a time_on_page event with
-- no pageview row for the day is dropped rather than creating an empty row.
CREATE OR REPLACE FUNCTION public.add_analytics_time_on_page(
  p_target_type TEXT,
  p_target_id UUID,
  p_date DATE,
  p_seconds INTEGER
)
RETURNS VOID
LANGUAGE sql
SET search_path = ''
AS $$
  UPDATE public.analytics
  SET time_on_page = COALESCE(time_on_page, 0) + p_seconds
  WHERE target_type = p_target_type
    AND target_id = p_target_id
    AND date = p_date;
$$;

-- Service role only: the tracker calls these server-side. Without the revoke,
-- anyone holding the publishable key could inflate counters via PostgREST.
REVOKE ALL ON FUNCTION public.track_analytics_pageview(TEXT, UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.add_analytics_time_on_page(TEXT, UUID, DATE, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_analytics_pageview(TEXT, UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_analytics_time_on_page(TEXT, UUID, DATE, INTEGER) TO service_role;

COMMIT;
