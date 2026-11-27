import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getCategoriesWithCounts } from '@/lib/categories-with-counts';

const FIELDS = 'name, slug, short_description, logo_url, upvotes, views, plan';
const LIMIT = 8;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Letters, digits, spaces and a few separators: keeps the PostgREST filter string well-formed. */
const cleanQuery = (q: string) => q.replace(/[^\p{L}\p{N}\s.\-+#]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);

/**
 * GET /api/search?q= — the ⌘K palette.
 * Without q: "Leading this week" (most upvoted listings published in the last
 * 7 days, topped up with the all-time leaders). With q: matching listings and
 * categories.
 */
export async function GET(request: Request) {
  const limit = await checkRateLimit(request, 'general');
  if (!limit.allowed) return createRateLimitResponse(limit);

  const supabase = getSupabaseAdmin();
  const q = cleanQuery(new URL(request.url).searchParams.get('q') || '');

  try {
    if (!q) {
      const since = new Date(Date.now() - WEEK_MS).toISOString();
      const [week, allTime] = await Promise.all([
        supabase.from('apps').select(FIELDS).eq('status', 'live').gte('published_at', since)
          .order('upvotes', { ascending: false }).order('views', { ascending: false }).limit(LIMIT),
        supabase.from('apps').select(FIELDS).eq('status', 'live')
          .order('upvotes', { ascending: false }).order('views', { ascending: false }).limit(LIMIT),
      ]);
      if (week.error || allTime.error) throw week.error || allTime.error;
      const seen = new Set<string>();
      const projects = [...(week.data || []), ...(allTime.data || [])]
        .filter((p) => !seen.has(p.slug) && seen.add(p.slug))
        .slice(0, LIMIT);
      return NextResponse.json(
        { mode: 'leading', projects, categories: [] },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
      );
    }

    const pattern = `%${q}%`;
    const [projects, categories] = await Promise.all([
      supabase.from('apps').select(FIELDS).eq('status', 'live')
        .or(`name.ilike.${pattern},short_description.ilike.${pattern}`)
        .order('upvotes', { ascending: false }).order('views', { ascending: false }).limit(LIMIT),
      getCategoriesWithCounts().catch(() => []),
    ]);
    if (projects.error) throw projects.error;
    const needle = q.toLowerCase();
    return NextResponse.json(
      {
        mode: 'results',
        projects: projects.data || [],
        categories: categories
          .filter((c) => c.name.toLowerCase().includes(needle) && c.app_count > 0)
          .sort((a, b) => b.app_count - a.app_count)
          .slice(0, 4)
          .map(({ name, slug, app_count }) => ({ name, slug, count: app_count })),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    );
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
