import { siteConfig } from "@/config/site.config";

/**
 * Ahrefs Domain Rating (DR) — free public endpoint.
 *
 * `GET https://api.ahrefs.com/v3/public/domain-rating-free?target=<domain>`
 * requires no API key and costs 0 units. Ahrefs' license requires attribution,
 * so the badge that renders this value links back to Ahrefs.
 *
 * Docs: https://docs.ahrefs.com/en/api/reference/public/get-domain-rating-free
 */

const AHREFS_DR_ENDPOINT = "https://api.ahrefs.com/v3/public/domain-rating-free";

/** Last-known DR — shown if the live fetch fails so the badge always renders. */
const FALLBACK_DR = 21;

/** Cache the value for 24h — DR moves slowly and the endpoint is rate-shared. */
const REVALIDATE_SECONDS = 60 * 60 * 24;

export interface DomainRating {
  /** DR on the 0–100 scale, rounded to an integer. */
  dr: number;
  /** Bare domain the score is for (e.g. "ailaunch.space"). */
  target: string;
  /** Ahrefs license URL that applies to the data, when returned. */
  license?: string;
  /** True when the value came from the live API (not the fallback). */
  live: boolean;
}

/** Strip protocol, `www.`, path and trailing slash → bare domain. */
export function toBareDomain(input: string): string {
  return input
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .trim()
    .toLowerCase();
}

/**
 * The domain we report DR for.
 *
 * Domain Rating is always measured for the canonical public site. In local dev
 * (`localhost`) or on preview deployments (`*.vercel.app`) the app URL is not a
 * ratable public domain, so fall back to the canonical apex domain there.
 */
const derivedDomain = toBareDomain(siteConfig.url);
const NON_PUBLIC_HOST = /^(localhost|127\.|0\.0\.0\.0|\[)|\.vercel\.app$/i;
export const SITE_DOMAIN = NON_PUBLIC_HOST.test(derivedDomain)
  ? "ailaunch.space"
  : derivedDomain;

/** Public Ahrefs authority checker link for attribution / "learn more". */
export function ahrefsCheckerUrl(target: string = SITE_DOMAIN): string {
  return `https://ahrefs.com/website-authority-checker/?input=${encodeURIComponent(target)}`;
}

/**
 * Fetch the current Domain Rating for `target` (defaults to this site).
 * Never throws — returns the fallback value on any error so callers can render
 * unconditionally.
 */
export async function getDomainRating(
  target: string = SITE_DOMAIN
): Promise<DomainRating> {
  try {
    const url = `${AHREFS_DR_ENDPOINT}?target=${encodeURIComponent(target)}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": `${siteConfig.name} (+${siteConfig.url})`,
      },
      next: { revalidate: REVALIDATE_SECONDS, tags: ["domain-rating"] },
    });

    if (!res.ok) {
      throw new Error(`Ahrefs DR request failed: ${res.status}`);
    }

    const data = await res.json();
    const raw = data?.domain_rating?.domain_rating;

    if (typeof raw !== "number" || Number.isNaN(raw)) {
      throw new Error("Ahrefs DR response missing domain_rating");
    }

    return {
      dr: Math.round(raw),
      target,
      license: data?.domain_rating?.license,
      live: true,
    };
  } catch (error) {
    console.warn("getDomainRating fell back to last-known value:", error);
    return { dr: FALLBACK_DR, target, live: false };
  }
}
