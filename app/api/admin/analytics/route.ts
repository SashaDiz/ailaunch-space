import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/supabase/auth';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import {
  isDataFastConfigured,
  getDataFastOverview,
  getDataFastTimeseries,
  getDataFastBreakdown,
  getDataFastRealtime,
  resolveRange,
  type DataFastRange,
} from '@/lib/datafast';

const VALID_RANGES: DataFastRange[] = ['24h', '7d', '30d', '3m', '6m', '12m', 'all'];

/**
 * Admin gate. Mirrors app/api/admin/route.ts: a CRON_SECRET bearer token for
 * scripted access, otherwise a validated Supabase session with admin rights.
 */
async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  // getUser() validates the JWT server-side; getSession() only reads cookies.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  if (!(await checkIsAdmin(user.id))) {
    return NextResponse.json(
      { error: 'Admin access required', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * GET /api/admin/analytics?range=30d
 *
 * Live site analytics straight from the DataFast API. Each upstream call is
 * settled independently so a single failing endpoint degrades one panel
 * instead of blanking the whole dashboard.
 */
export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const rateLimitResult = await checkRateLimit(request, 'admin');
  if (!rateLimitResult.allowed) return createRateLimitResponse(rateLimitResult);

  const { searchParams } = new URL(request.url);
  const requested = searchParams.get('range') as DataFastRange | null;
  const range: DataFastRange =
    requested && VALID_RANGES.includes(requested) ? requested : '30d';

  if (!isDataFastConfigured()) {
    return NextResponse.json({
      success: true,
      configured: false,
      range,
      message:
        'DataFast is not connected. Add DATAFAST_API_KEY (Website Settings → API in datafa.st) to show live analytics.',
    });
  }

  const [overview, timeseries, pages, referrers, countries, devices, realtime] =
    await Promise.allSettled([
      getDataFastOverview(range),
      getDataFastTimeseries(range),
      getDataFastBreakdown('pages', range, 10),
      getDataFastBreakdown('referrers', range, 10),
      getDataFastBreakdown('countries', range, 10),
      getDataFastBreakdown('devices', range, 5),
      getDataFastRealtime(),
    ]);

  const errors: string[] = [];
  const unwrap = <T,>(result: PromiseSettledResult<T>, label: string, fallback: T): T => {
    if (result.status === 'fulfilled') return result.value;
    console.error(`DataFast ${label} failed:`, result.reason);
    errors.push(label);
    return fallback;
  };

  const series = unwrap(timeseries, 'timeseries', {
    interval: resolveRange(range).interval,
    points: [],
  });

  return NextResponse.json({
    success: true,
    configured: true,
    range,
    interval: series.interval,
    fetchedAt: new Date().toISOString(),
    overview: unwrap(overview, 'overview', null),
    timeseries: series.points.map((point) => ({
      date: point.timestamp,
      visitors: point.visitors ?? 0,
      newVisitors: point.new_visitors ?? 0,
      returningVisitors: point.returning_visitors ?? 0,
      pageviews: point.pageviews ?? 0,
      sessions: point.sessions ?? 0,
      revenue: point.revenue ?? 0,
      payments: point.payments ?? 0,
    })),
    breakdowns: {
      pages: unwrap(pages, 'pages', []),
      referrers: unwrap(referrers, 'referrers', []),
      countries: unwrap(countries, 'countries', []),
      devices: unwrap(devices, 'devices', []),
    },
    realtime: unwrap(realtime, 'realtime', 0),
    ...(errors.length ? { errors } : {}),
  });
}
