import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { featureGuard } from "@/lib/features";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rate-limit";

/** Rows older than this are pruned; they stopped counting as live long ago. */
const PRUNE_AFTER_MS = 60 * 60 * 1000;
/** Prune on roughly one heartbeat in this many — no cron needed. */
const PRUNE_ONE_IN = 50;

/** Random per-tab id minted by SiteTracker (crypto.randomUUID). */
const SESSION_ID = /^[0-9a-f-]{36}$/i;

/**
 * Areas whose paths are nobody's business on a public feed. The session
 * still counts as live; it just isn't listed as "reading" anything.
 */
const PRIVATE_PREFIXES = ["/admin", "/dashboard", "/settings", "/edit", "/profile", "/auth", "/submit", "/api"];

function publicPath(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.length > 200) return null;
  // Pathname only: drop any query or fragment the client may have sent.
  const path = raw.split(/[?#]/)[0];
  if (PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return path;
}

/** Whole degrees (~100 km): enough to place a dot on a globe, not a person. */
function coarseCoord(raw: string | null, limit: number): number | null {
  if (!raw) return null;
  const value = Math.round(Number(raw));
  return Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
}

/**
 * POST /api/analytics/presence  { session_id, page_path }
 *
 * SiteTracker's heartbeat, sent every ~30s while a tab is visible and on
 * every route change. Country and coordinates come from Vercel's geo
 * headers (absent locally, so dev sessions have no country and no dot).
 */
export async function POST(request: Request) {
  const guard = featureGuard("analytics");
  if (guard) return guard;

  const rateLimitResult = await checkRateLimit(request, "analytics");
  if (!rateLimitResult.allowed) {
    // createRateLimitResponse returns a plain { status, headers, body }.
    const rl = createRateLimitResponse(rateLimitResult);
    return new NextResponse(rl.body, { status: rl.status, headers: rl.headers });
  }

  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse((await request.text()) || "{}");
  } catch {
    // Treated as invalid below.
  }

  const sessionId = typeof body.session_id === "string" ? body.session_id : "";
  if (!SESSION_ID.test(sessionId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = publicPath(body.page_path);
  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase() ?? null;
  const supabase = getSupabaseAdmin();

  try {
    const { data: existing } = await supabase
      .from("site_presence")
      .select("path, path_since")
      .eq("session_id", sessionId)
      .maybeSingle();

    const now = new Date().toISOString();
    const samePage = existing && existing.path === path;

    const { error } = await supabase.from("site_presence").upsert({
      session_id: sessionId,
      country: country && /^[A-Z]{2}$/.test(country) ? country : null,
      latitude: coarseCoord(request.headers.get("x-vercel-ip-latitude"), 90),
      longitude: coarseCoord(request.headers.get("x-vercel-ip-longitude"), 180),
      path,
      // "Reading /x · 44s ago" counts from when they opened that page.
      path_since: samePage ? existing.path_since : now,
      last_seen: now,
    });
    if (error) throw error;

    if (Math.random() < 1 / PRUNE_ONE_IN) {
      await supabase
        .from("site_presence")
        .delete()
        .lt("last_seen", new Date(Date.now() - PRUNE_AFTER_MS).toISOString());
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Presence heartbeat failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
