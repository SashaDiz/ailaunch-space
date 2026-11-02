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
/** Window for the visits total. */
const VISITS_DAYS = 30;
/** Window for the country chips. */
const COUNTRY_DAYS = 7;
/** PostgREST returns at most this many rows per request. */
const PAGE_SIZE = 1000;
/** Same fixed id app/api/analytics/track uses for site-level records. */
const SITE_TARGET_ID = '00000000-0000-0000-0000-000000000001';
/**
 * Every viewer of the catalog polls this, so the answer is shared for a few
 * seconds per server instance on top of the CDN's s-maxage.
 */
const MEMO_MS = 10_000;

let memo: { at: number; body: unknown } | null = null;

type DailyRow = { date: string; views: number | null; countries: Record<string, number> | null };

/**
 * Site-level daily rows since `sinceDay`, every page of them. A day can hold
 * more than one row (the tracker has raced into duplicates before), so the
 * row count is not bounded by the day count and an unpaged read silently
 * stops at PostgREST's 1000-row cap.
 */
async function dailyRows(sinceDay: string): Promise<DailyRow[]> {
  const supabase = getSupabaseAdmin();
  const rows: DailyRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('analytics')
      .select('date, views, countries')
      .eq('target_type', 'general')
      .eq('target_id', SITE_TARGET_ID)
      .gte('date', sinceDay)
      .order('date', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data as DailyRow[]));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

/** YYYY-MM-DD for `days` days ago, inclusive of today (UTC, like the tracker). */
function dayAgo(days: number): string {
  return new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
}

async function compute() {
  const supabase = getSupabaseAdmin();
  const liveSince = new Date(Date.now() - LIVE_WINDOW_MS).toISOString();
  const weekStart = dayAgo(COUNTRY_DAYS);

  const [live, month] = await Promise.all([
    supabase
      .from('site_presence')
      .select('country, latitude, longitude, path, path_since')
      .gte('last_seen', liveSince)
      .order('path_since', { ascending: false })
      .limit(1000),
    // Daily rows from the pageview tracker; one view is one browser session.
    dailyRows(dayAgo(VISITS_DAYS)).catch((error) => {
      console.error('Live stats: daily analytics read failed:', error);
      return [] as DailyRow[];
    }),
  ]);

  if (live.error) console.error('Live stats: presence read failed:', live.error);

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
  for (const row of month.filter((r) => r.date >= weekStart)) {
    for (const [code, count] of Object.entries((row.countries ?? {}) as Record<string, number>)) {
      // The tracker stores "unknown" when the platform sent no geo header.
      if (!/^[A-Z]{2}$/.test(code)) continue;
      byCountry.set(code, (byCountry.get(code) ?? 0) + (Number(count) || 0));
    }
  }
  const ranked = [...byCountry.entries()].sort((a, b) => b[1] - a[1]);

  return {
    success: true,
    configured: true,
    now: sessions.length,
    countries: countries.size,
    points: [...points.values()],
    feed,
    // Sessions, not unique people: the tracker's daily uniques can't be
    // de-duplicated across days, so summing them would count regulars twice.
    visits: month.reduce((sum, d) => sum + (d.views ?? 0), 0),
    visitsDays: VISITS_DAYS,
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
 * the 7-day country split and 30-day visits from the site-level
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
