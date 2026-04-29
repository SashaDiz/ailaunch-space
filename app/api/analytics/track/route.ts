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

// --- Increment a key inside a JSONB object (e.g. { "US": 5 } -> { "US": 6 }) ---

function incrementJsonbKey(
  existing: Record<string, number> | null | undefined,
  key: string,
): Record<string, number> {
  const obj: Record<string, number> = { ...(existing || {}) };
  obj[key] = (obj[key] || 0) + 1;
  return obj;
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

    const {
      page_path,
      referrer,
      project_id,
      event_type = "pageview",
      event_name,
      duration,
    } = body;

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

    // --- Handle time_on_page event: update the existing record's time_on_page ---
    if (event_type === "time_on_page" && typeof duration === "number" && duration > 0) {
      // Find the record for today and update time_on_page
      const { data: existing } = await supabase
        .from("analytics")
        .select("id, time_on_page")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        // Accumulate total time; the column is an integer (seconds)
        const currentTime = existing.time_on_page || 0;
        await supabase
          .from("analytics")
          .update({ time_on_page: currentTime + Math.round(duration) })
          .eq("id", existing.id);
      }

      return NextResponse.json({ ok: true });
    }

    // --- Standard pageview / event tracking ---

    // Check if a record exists for today for this target
    const { data: existing } = await supabase
      .from("analytics")
      .select("id, views, unique_visitors, referrers, devices, browsers, countries")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .eq("date", today)
      .maybeSingle();

    if (existing) {
      // Check if this visitor was already counted today
      const knownHashes: string[] = (existing.referrers as any)?.visitor_hashes || [];
      const isNewVisitor = !knownHashes.includes(visitorHash);

      // Build referrer sources map (strip visitor_hashes before merging)
      const referrerSources: Record<string, number> = {
        ...((existing.referrers as any)?.sources || {}),
      };
      if (referrer) {
        try {
          const refHost = new URL(referrer).hostname || "direct";
          referrerSources[refHost] = (referrerSources[refHost] || 0) + 1;
        } catch {
          // Ignore invalid referrer URLs
        }
      }

      await supabase
        .from("analytics")
        .update({
          views: (existing.views || 0) + 1,
          unique_visitors: isNewVisitor
            ? (existing.unique_visitors || 0) + 1
            : existing.unique_visitors || 0,
          referrers: {
            visitor_hashes: isNewVisitor
              ? [...knownHashes, visitorHash]
              : knownHashes,
            sources: referrerSources,
          },
          devices: incrementJsonbKey(existing.devices as Record<string, number>, deviceType),
          browsers: incrementJsonbKey(existing.browsers as Record<string, number>, browserName),
          countries: incrementJsonbKey(existing.countries as Record<string, number>, country),
        })
        .eq("id", existing.id);
    } else {
      // Create new daily record
      const referrerSources: Record<string, number> = {};
      if (referrer) {
        try {
          const refHost = new URL(referrer).hostname || "direct";
          referrerSources[refHost] = 1;
        } catch {
          // Ignore invalid referrer URLs
        }
      }

      await supabase.from("analytics").insert({
        target_type: targetType,
        target_id: targetId,
        date: today,
        hour: new Date().getHours(),
        views: 1,
        unique_visitors: 1,
        referrers: {
          visitor_hashes: [visitorHash],
          sources: referrerSources,
        },
        devices: { [deviceType]: 1 },
        browsers: { [browserName]: 1 },
        countries: { [country]: 1 },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[analytics/track] Error:", error);
    return NextResponse.json({ ok: true }); // Silent fail for tracking
  }
}
