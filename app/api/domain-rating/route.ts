import { NextResponse } from "next/server";
import { getDomainRating } from "@/lib/domain-rating";

/**
 * GET /api/domain-rating — current Ahrefs Domain Rating for the site.
 *
 * Centralizes the upstream call so Ahrefs is hit at most once per cache window
 * (not once per prerendered page / per visitor). The DomainRatingBadge reads
 * this at runtime, so the build never depends on Ahrefs being reachable.
 */
export const runtime = "nodejs";
// Cache the route response for 24h; getDomainRating() also caches its own fetch.
export const revalidate = 86400;

export async function GET() {
  const data = await getDomainRating();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control":
        "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
