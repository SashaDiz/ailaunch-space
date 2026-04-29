import { siteConfig } from '@/config/site.config';

const siteDomain = new URL(siteConfig.url).hostname.replace('www.', '');
const escapedDomain = siteDomain.replace(/\./g, '\\.');

export type BadgeVerificationOutcome =
  | { kind: 'verified'; matchedTag: string }
  | { kind: 'nofollow_only'; matchedTag: string }
  | { kind: 'image_only' }
  | { kind: 'not_found' }
  | { kind: 'fetch_error'; reason: 'timeout' | 'network' | 'http'; statusCode?: number; message?: string }
  | { kind: 'invalid_url'; message: string };

export interface BadgeVerificationResult {
  outcome: BadgeVerificationOutcome;
  checkedUrl: string;
}

const FETCH_TIMEOUT_MS = 10_000;

export async function verifyBadgeOnUrl(rawUrl: string): Promise<BadgeVerificationResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    return {
      outcome: { kind: 'invalid_url', message: 'Invalid URL format. Provide a valid HTTP/HTTPS URL.' },
      checkedUrl: rawUrl,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent':
          `Mozilla/5.0 (compatible; ${siteConfig.name.replace(/\s/g, '')}Bot/1.0; +${siteConfig.url})`,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      return { outcome: { kind: 'fetch_error', reason: 'timeout' }, checkedUrl: url.toString() };
    }
    return {
      outcome: { kind: 'fetch_error', reason: 'network', message: err?.message },
      checkedUrl: url.toString(),
    };
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    return {
      outcome: { kind: 'fetch_error', reason: 'http', statusCode: response.status },
      checkedUrl: url.toString(),
    };
  }

  const html = await response.text();
  return { outcome: parseHtmlForBadge(html), checkedUrl: url.toString() };
}

export function parseHtmlForBadge(html: string): BadgeVerificationOutcome {
  const anchorTagPattern = new RegExp(
    `<a\\s+[^>]*href\\s*=\\s*["']https?:\\/\\/(www\\.)?${escapedDomain}\\/?[^"']*["'][^>]*>`,
    'gi'
  );
  const anchorMatches = html.match(anchorTagPattern);

  if (anchorMatches && anchorMatches.length > 0) {
    let firstNofollowTag: string | null = null;

    for (const tag of anchorMatches) {
      const relMatch = tag.match(/rel\s*=\s*["']([^"']*)["']/i);
      if (relMatch) {
        const relValue = relMatch[1].toLowerCase();
        if (relValue.includes('nofollow')) {
          firstNofollowTag = firstNofollowTag ?? tag;
          continue;
        }
      }
      return { kind: 'verified', matchedTag: tag };
    }

    if (firstNofollowTag) {
      return { kind: 'nofollow_only', matchedTag: firstNofollowTag };
    }
  }

  const imgPattern = new RegExp(
    `src\\s*=\\s*["']https?:\\/\\/(www\\.)?${escapedDomain}[^"']*["']`,
    'gi'
  );
  if (html.match(imgPattern)?.length) {
    return { kind: 'image_only' };
  }

  return { kind: 'not_found' };
}

export function describeOutcome(result: BadgeVerificationResult): {
  verified: boolean;
  message: string;
  details: Record<string, unknown>;
} {
  const { outcome, checkedUrl } = result;
  switch (outcome.kind) {
    case 'verified':
      return {
        verified: true,
        message: `Badge verified! Dofollow link to ${siteDomain} found on your website.`,
        details: { checked_url: checkedUrl, link_found: true, is_dofollow: true, matched_tag: outcome.matchedTag },
      };
    case 'nofollow_only':
      return {
        verified: false,
        message: `Link to ${siteDomain} found, but it has rel="nofollow". Remove the nofollow attribute to get a dofollow backlink.`,
        details: { checked_url: checkedUrl, link_found: true, is_dofollow: false, has_nofollow: true, matched_tag: outcome.matchedTag },
      };
    case 'image_only':
      return {
        verified: false,
        message: `Badge image found, but no clickable link to ${siteDomain}. Wrap the badge in an <a> tag linking to ${siteDomain}.`,
        details: { checked_url: checkedUrl, image_found: true, link_found: false },
      };
    case 'not_found':
      return {
        verified: false,
        message: `Link to ${siteDomain} not found on your homepage. Add the badge and try again.`,
        details: { checked_url: checkedUrl, link_found: false },
      };
    case 'fetch_error':
      if (outcome.reason === 'timeout') {
        return {
          verified: false,
          message: 'Request timed out. Your website may be slow or blocking requests.',
          details: { checked_url: checkedUrl, error: 'timeout' },
        };
      }
      if (outcome.reason === 'http') {
        return {
          verified: false,
          message: `Website returned error status: ${outcome.statusCode}`,
          details: { checked_url: checkedUrl, status_code: outcome.statusCode },
        };
      }
      return {
        verified: false,
        message: "Could not access your website. Ensure it's publicly accessible.",
        details: { checked_url: checkedUrl, error: outcome.message },
      };
    case 'invalid_url':
      return {
        verified: false,
        message: outcome.message,
        details: { checked_url: checkedUrl },
      };
  }
}
