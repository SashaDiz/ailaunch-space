/**
 * DataFast (datafa.st) API client — server-side only.
 *
 * Powers the live traffic + revenue-attribution panels in the admin area.
 * Docs: https://datafa.st/docs/api
 *
 * Auth: `Authorization: Bearer <token>`.
 *   - `df_`  website API key  → scoped to one website, `websiteId` must be omitted
 *   - `dft_` account token    → multi-website, `websiteId` is required
 * The key lives in `DATAFAST_API_KEY` and must never reach the browser — every
 * call in this module runs behind the admin-guarded API route.
 */

import { analyticsConfig } from '@/config/analytics.config';

const DATAFAST_API_BASE = 'https://datafa.st/api/v1';

/** Cache window (seconds) for analytics reads — keeps the dashboard snappy without going stale. */
const CACHE_TTL = 60;
/** Realtime is polled far more often, so it gets a much shorter window. */
const REALTIME_CACHE_TTL = 15;

export type DataFastRange = '24h' | '7d' | '30d' | '3m' | '6m' | '12m' | 'all';

export type DataFastInterval = 'hour' | 'day' | 'week' | 'month';

export interface DataFastOverview {
  visitors: number;
  new_visitors: number;
  returning_visitors: number;
  pageviews: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration: number;
  currency: string;
  revenue: number;
  payments: number;
  revenue_per_visitor: number;
  conversion_rate: number;
}

export interface DataFastTimeseriesPoint {
  timestamp: string;
  visitors: number;
  new_visitors: number;
  returning_visitors: number;
  pageviews: number;
  sessions: number;
  revenue: number;
  payments: number;
}

export interface DataFastBreakdownRow {
  /** Human label for the row (page path, referrer, country, device …). */
  label: string;
  /** Flag/icon URL — only returned by the countries breakdown. */
  image?: string;
  visitors: number;
  revenue: number;
  payments: number;
}

export type DataFastBreakdownKind =
  | 'pages'
  | 'referrers'
  | 'countries'
  | 'devices'
  | 'browsers'
  | 'campaigns';

/** The field that carries the row label for each breakdown endpoint. */
const BREAKDOWN_LABEL_FIELD: Record<DataFastBreakdownKind, string> = {
  pages: 'path',
  referrers: 'referrer',
  countries: 'country',
  devices: 'device',
  browsers: 'browser',
  campaigns: 'utm_campaign',
};

export function isDataFastConfigured(): boolean {
  return Boolean(process.env.DATAFAST_API_KEY);
}

/** Account tokens (`dft_`) are multi-website and must scope every request. */
function requiresWebsiteId(apiKey: string): boolean {
  return apiKey.startsWith('dft_');
}

/**
 * Map a dashboard range preset to an API date window plus a sensible bucket
 * size. `all` returns no window at all — DataFast then reports all-time.
 */
export function resolveRange(range: DataFastRange): {
  startAt?: string;
  endAt?: string;
  interval: DataFastInterval;
} {
  const now = new Date();

  if (range === 'all') {
    return { interval: 'month' };
  }

  if (range === '24h') {
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {
      startAt: start.toISOString(),
      endAt: now.toISOString(),
      interval: 'hour',
    };
  }

  const days: Record<Exclude<DataFastRange, 'all' | '24h'>, number> = {
    '7d': 7,
    '30d': 30,
    '3m': 90,
    '6m': 180,
    '12m': 365,
  };
  const span = days[range] ?? 30;
  const start = new Date(now.getTime() - span * 24 * 60 * 60 * 1000);

  const toDay = (d: Date) => d.toISOString().split('T')[0];

  return {
    startAt: toDay(start),
    endAt: toDay(now),
    // Long ranges get coarser buckets so the charts stay readable.
    interval: span > 180 ? 'month' : span > 60 ? 'week' : 'day',
  };
}

class DataFastError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'DataFastError';
    this.status = status;
  }
}

async function datafastFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  revalidate: number = CACHE_TTL
): Promise<T> {
  const apiKey = process.env.DATAFAST_API_KEY;
  if (!apiKey) {
    throw new DataFastError('DATAFAST_API_KEY is not configured', 500);
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }

  // `df_` keys are already bound to a single website and reject websiteId.
  if (requiresWebsiteId(apiKey) && analyticsConfig.datafast?.websiteId) {
    search.set('websiteId', analyticsConfig.datafast.websiteId);
  }

  const query = search.toString();
  const url = `${DATAFAST_API_BASE}${path}${query ? `?${query}` : ''}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    next: { revalidate },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new DataFastError(
      `DataFast ${path} failed (${response.status}): ${body.slice(0, 300)}`,
      response.status
    );
  }

  return response.json() as Promise<T>;
}

export async function getDataFastOverview(
  range: DataFastRange
): Promise<DataFastOverview | null> {
  const { startAt, endAt } = resolveRange(range);
  const json = await datafastFetch<{ data: DataFastOverview[] }>(
    '/analytics/overview',
    {
      fields:
        'visitors,new_visitors,returning_visitors,pageviews,sessions,bounce_rate,avg_session_duration,currency,revenue,payments,revenue_per_visitor,conversion_rate',
      startAt,
      endAt,
    }
  );
  // The overview endpoint wraps its single result in an array.
  return json.data?.[0] ?? null;
}

export async function getDataFastTimeseries(
  range: DataFastRange
): Promise<{ interval: DataFastInterval; points: DataFastTimeseriesPoint[] }> {
  const { startAt, endAt, interval } = resolveRange(range);
  const json = await datafastFetch<{ data: DataFastTimeseriesPoint[] }>(
    '/analytics/timeseries',
    {
      fields:
        'visitors,new_visitors,returning_visitors,pageviews,sessions,revenue,payments',
      interval,
      startAt,
      endAt,
      limit: 1000,
    }
  );
  return { interval, points: json.data ?? [] };
}

export async function getDataFastBreakdown(
  kind: DataFastBreakdownKind,
  range: DataFastRange,
  limit = 10
): Promise<DataFastBreakdownRow[]> {
  const { startAt, endAt } = resolveRange(range);
  const labelField = BREAKDOWN_LABEL_FIELD[kind];

  const json = await datafastFetch<{ data: Record<string, any>[] }>(
    `/analytics/${kind}`,
    { startAt, endAt, limit }
  );

  return (json.data ?? []).map((row) => ({
    label: row[labelField] ?? row.path ?? row.hostname ?? 'Unknown',
    ...(row.image ? { image: row.image } : {}),
    visitors: row.visitors ?? 0,
    revenue: row.revenue ?? 0,
    payments: row.payments ?? 0,
  }));
}

/** Visitors active in the last 10 minutes. Ignores the selected range. */
export async function getDataFastRealtime(): Promise<number> {
  const json = await datafastFetch<{ data: { visitors: number }[] }>(
    '/analytics/realtime',
    { fields: 'visitors' },
    REALTIME_CACHE_TTL
  );
  return json.data?.[0]?.visitors ?? 0;
}
