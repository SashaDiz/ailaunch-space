/**
 * Data for the public /stats page. Server-only.
 *
 * Every number is first-party: daily rows the pageview tracker writes to
 * `analytics` (target_type 'general', tracking since `trackingSince`),
 * listings and makers from the database, Domain Rating from Ahrefs.
 */
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { getDomainRating } from '@/lib/domain-rating';
import {
  dayKey, lastDays, median, mergeDays, monthlyVisits, perDay, shares, visitsSeries,
  type DailyAnalyticsRow,
} from '@/lib/site-stats-math';

/** Same fixed id app/api/analytics/track uses for site-level records. */
const SITE_TARGET_ID = '00000000-0000-0000-0000-000000000001';
const PAGE_SIZE = 1000;
export const STATS_WINDOW_DAYS = 30;

async function allRows<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await build(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export async function getSiteStats(now = new Date()) {
  const supabase = getSupabaseAdmin();
  const days = lastDays(STATS_WINDOW_DAYS, now);
  const today = dayKey(now);
  const windowStart = `${days[0]}T00:00:00.000Z`;

  const [analytics, listings, makers, rating] = await Promise.all([
    allRows<DailyAnalyticsRow>((from, to) => supabase
      .from('analytics')
      .select('date, views, unique_visitors, countries, devices')
      .eq('target_type', 'general')
      .eq('target_id', SITE_TARGET_ID)
      .order('date', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)),
    allRows<{ published_at: string | null; launched_at: string | null; created_at: string; views: number | null; clicks: number | null; plan: string | null }>((from, to) => supabase
      .from('apps')
      .select('published_at, launched_at, created_at, views, clicks, plan')
      .eq('status', 'live')
      .order('id', { ascending: true })
      .range(from, to)),
    allRows<{ created_at: string }>((from, to) => supabase
      .from('users')
      .select('created_at')
      .order('id', { ascending: true })
      .range(from, to)),
    getDomainRating(),
  ]);

  const merged = mergeDays(analytics);
  const visits = visitsSeries(merged, days, today);
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
  const allTimeVisits = sum([...merged.values()].map((d) => d.visits));
  const trackingSince = [...merged.keys()].sort()[0] || today;
  const completeDays = visits.filter((d) => !d.partial);

  const publishedAt = listings.map((l) => l.published_at || l.launched_at || l.created_at);
  const listedBefore = publishedAt.filter((ts) => ts && ts < windowStart).length;
  const makersBefore = makers.filter((m) => m.created_at < windowStart).length;
  const listingViews = listings.map((l) => l.views || 0);

  return {
    generatedAt: now.toISOString(),
    windowDays: STATS_WINDOW_DAYS,
    trackingSince,
    tiles: {
      visits: { window: sum(visits.map((d) => d.visits)), allTime: allTimeVisits },
      visitorsPerDay: {
        window: completeDays.length ? Math.round(sum(completeDays.map((d) => d.visitors)) / completeDays.length) : 0,
        peak: Math.max(0, ...visits.map((d) => d.visitors)),
      },
      listings: { window: listings.length - listedBefore, allTime: listings.length },
      premium: listings.filter((l) => l.plan === 'premium').length,
      makers: { window: makers.length - makersBefore, allTime: makers.length },
      listingViews: { allTime: sum(listingViews), median: median(listingViews) },
      clicks: { allTime: sum(listings.map((l) => l.clicks || 0)) },
      countries: {
        window: shares(merged, days, 'countries').length,
        allTime: shares(merged, [...merged.keys()], 'countries').length,
      },
      domainRating: { value: rating.dr, live: rating.live },
    },
    visits,
    monthly: monthlyVisits(merged),
    listingsPerDay: perDay(publishedAt, days, today),
    makersPerDay: perDay(makers.map((m) => m.created_at), days, today, makersBefore),
    countries: shares(merged, days, 'countries').slice(0, 12),
  };
}

export type SiteStats = Awaited<ReturnType<typeof getSiteStats>>;
