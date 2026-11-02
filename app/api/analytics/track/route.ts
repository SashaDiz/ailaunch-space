import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { featureGuard } from "@/lib/features";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rate-limit";
import crypto from "crypto";

// Fixed UUID for site-level analytics records
const SITE_TARGET_ID = "00000000-0000-0000-0000-000000000001";

function getVisitorIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

function hashIp(ip: string, date: string): string {
  return crypto.createHash("sha256").update(`${ip}:${date}`).digest("hex").slice(0, 16);
}

// --- Simple User-Agent parsing (no external dependency) ---

function parseDeviceType(ua: string): string {
  if (!ua) return "unknown";
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

function parseBrowserName(ua: string): string {
  if (!ua) return "unknown";
  // Order matters: check more specific patterns first
  if (/edg(e|a|ios)?\/\d/i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/crios/i.test(ua)) return "Chrome"; // Chrome on iOS
  if (/safari/i.test(ua) && !/chrome|chromium|crios/i.test(ua)) return "Safari";
  if (/chrome|chromium/i.test(ua)) return "Chrome";
  return "other";
}

// --- Extract country from deployment platform headers ---

function getCountry(request: Request): string {
  return (
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    "unknown"
  );
}

function getReferrerHost(referrer: unknown): string | null {
  if (typeof referrer !== "string" || !referrer) return null;
  try {
    return new URL(referrer).hostname || "direct";
  } catch {
    return null; // Ignore invalid referrer URLs
  }
}

export async function POST(request: Request) {
  // Feature guard
  const guard = featureGuard("analytics");
  if (guard) return guard;

  // Rate limiting
  const rateLimitResult = await checkRateLimit(request, "analytics");
  if (!rateLimitResult.allowed) {
    const rl = createRateLimitResponse(rateLimitResult);
    return NextResponse.json(JSON.parse(rl.body), {
      status: rl.status,
      headers: rl.headers,
    });
  }

  try {
    // Parse the body (sendBeacon may send empty or JSON string)
    let body: Record<string, any> = {};
    try {
      const text = await request.text();
      if (text && text !== "{}") {
        body = JSON.parse(text);
      }
    } catch {
      // Ignore parse errors — treat as empty body
    }

    const { referrer, project_id, event_type = "pageview", duration } = body;

    const ip = getVisitorIp(request);
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const visitorHash = hashIp(ip, today);
    const supabase = getSupabaseAdmin();

    // Parse UA & geo server-side
    const userAgent = request.headers.get("user-agent") || "";
    const deviceType = parseDeviceType(userAgent);
    const browserName = parseBrowserName(userAgent);
    const country = getCountry(request);

    // Determine target for this analytics record
    const targetType = project_id ? "app" : "general";
    const targetId = project_id || SITE_TARGET_ID;

    // Both writes are single-statement Postgres functions (see
    // supabase/migrations/20261101_analytics_daily_unique.sql): an upsert on
    // the unique (target_type, target_id, date) index, so concurrent requests
    // can neither lose increments nor create a second row for the day.

    // --- Handle time_on_page event: add to today's record ---
    if (event_type === "time_on_page" && typeof duration === "number" && duration > 0) {
      // The column is an integer (seconds)
      const { error } = await supabase.rpc("add_analytics_time_on_page", {
        p_target_type: targetType,
        p_target_id: targetId,
        p_date: today,
        p_seconds: Math.round(duration),
      });
      if (error) console.error("[analytics/track] time_on_page failed:", error.message);

      return NextResponse.json({ ok: true });
    }

    // --- Standard pageview / event tracking ---
    const { error } = await supabase.rpc("track_analytics_pageview", {
      p_target_type: targetType,
      p_target_id: targetId,
      p_date: today,
      p_visitor_hash: visitorHash,
      p_referrer_host: getReferrerHost(referrer),
      p_device: deviceType,
      p_browser: browserName,
      p_country: country,
    });
    if (error) console.error("[analytics/track] pageview failed:", error.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[analytics/track] Error:", error);
    return NextResponse.json({ ok: true }); // Silent fail for tracking
  }
}
