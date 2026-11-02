import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { featureGuard } from '@/lib/features';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

/** A session is "on the site right now" for this long after a heartbeat. */
const LIVE_WINDOW_MS = 5 * 60 * 1000;
/** Rows in the "who's reading what" feed. */
const FEED_LIMIT = 4;
/** Country chips shown before "+ N more". */
const TOP_COUNTRIES = 5;
/** Same fixed id app/api/analytics/track uses for site-level records. */
const SITE_TARGET_ID = '00000000-0000-0000-0000-000000000001';
/**
 * Every viewer of the catalog polls this, so the answer is shared for a few
 * seconds per server instance on top of the CDN's s-maxage.
 */
const MEMO_MS = 10_000;

let memo: { at: number; body: unknown } | null = null;

async function compute() {
  const supabase = getSupabaseAdmin();
  const liveSince = new Date(Date.now() - LIVE_WINDOW_MS).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [live, week, history] = await Promise.all([
    supabase
      .from('site_presence')
      .select('country, latitude, longitude, path, path_since')
      .gte('last_seen', liveSince)
      .order('path_since', { ascending: false })
      .limit(1000),
    // Site-level daily rows from the pageview tracker (one count per session).
    supabase
      .from('analytics')
      .select('countries')
      .eq('target_type', 'general')
      .eq('target_id', SITE_TARGET_ID)
      .gte('date', weekAgo),
    supabase
      .from('analytics')
      .select('date, unique_visitors')
      .eq('target_type', 'general')
      .eq('target_id', SITE_TARGET_ID)
      .order('date', { ascending: true }),
  ]);

  if (live.error) console.error('Live stats: presence read failed:', live.error);
  if (week.error) console.error('Live stats: weekly countries read failed:', week.error);
  if (history.error) console.error('Live stats: history read failed:', history.error);

  const sessions = live.data ?? [];
  const countries = new Set<string>();
  const points = new Map<string, [number, number]>();
  const feed: { countryCode: string; path: string; since: string | null }[] = [];

  for (const s of sessions) {
    if (s.country) countries.add(s.country);
    if (s.latitude !== null && s.longitude !== null) {
      points.set(`${s.latitude},${s.longitude}`, [s.latitude, s.longitude]);
    }
    // Rows arrive newest page-open first, so the feed reads like a live log.
    if (s.country && s.path && feed.length < FEED_LIMIT) {
      feed.push({ countryCode: s.country, path: s.path, since: s.path_since });
    }
  }

  const byCountry = new Map<string, number>();
  for (const row of week.data ?? []) {
    for (const [code, count] of Object.entries((row.countries ?? {}) as Record<string, number>)) {
      // The tracker stores "unknown" when the platform sent no geo header.
      if (!/^[A-Z]{2}$/.test(code)) continue;
      byCountry.set(code, (byCountry.get(code) ?? 0) + (Number(count) || 0));
    }
  }
  const ranked = [...byCountry.entries()].sort((a, b) => b[1] - a[1]);

  const days = history.data ?? [];

  return {
    success: true,
    configured: true,
    now: sessions.length,
    countries: countries.size,
    points: [...points.values()],
    feed,
    totalVisitors: days.reduce((sum, d) => sum + (d.unique_visitors ?? 0), 0),
    since: days[0]?.date ?? null,
    topCountries: ranked
      .slice(0, TOP_COUNTRIES)
      .map(([countryCode, visitors]) => ({ countryCode, visitors })),
    moreCountries: Math.max(0, ranked.length - TOP_COUNTRIES),
  };
}

/**
 * GET /api/live-stats
 *
 * Public "who's on the site right now" for the catalog block, built on our
 * own tracking: live sessions from `site_presence` (SiteTracker heartbeat),
 * the 7-day country split and all-time visitors from the site-level
 * `analytics` rows. Country-level only — the presence table holds no IP,
 * user id or user agent, and private paths are never stored.
 */
export async function GET(request: Request) {
  const guard = featureGuard('analytics');
  if (guard) return guard;

  const rateLimitResult = await checkRateLimit(request, 'general');
  if (!rateLimitResult.allowed) {
    // createRateLimitResponse returns a plain { status, headers, body }.
    const rl = createRateLimitResponse(rateLimitResult);
    return new NextResponse(rl.body, { status: rl.status, headers: rl.headers });
  }

  try {
    if (!memo || Date.now() - memo.at > MEMO_MS) {
      memo = { at: Date.now(), body: await compute() };
    }
    return NextResponse.json(memo.body, {
      headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
    });
  } catch (error) {
    console.error('Live stats failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to load live stats' }, { status: 500 });
  }
}
