import { NextResponse } from "next/server";
import { siteConfig } from '@/config/site.config';
import { featureGuard } from '@/lib/features';

// Derive domain info from siteConfig for use in regex patterns and messages
const siteDomain = new URL(siteConfig.url).hostname.replace('www.', '');
const escapedDomain = siteDomain.replace(/\./g, '\\.');

/**
 * POST /api/verify-badge
 * Verifies if a website contains a link to the platform
 */
export async function POST(request) {
  const guard = featureGuard('badges');
  if (guard) return guard;

  try {
    const body = await request.json();
    const { websiteUrl } = body;

    // Validate URL
    if (!websiteUrl) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: "Website URL is required",
        },
        { status: 400 }
      );
    }

    // Validate URL format
    let url;
    try {
      url = new URL(websiteUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: "Invalid URL format. Please provide a valid HTTP/HTTPS URL.",
        },
        { status: 400 }
      );
    }

    // Fetch the website with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let response;
    try {
      response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          "User-Agent":
            `Mozilla/5.0 (compatible; ${siteConfig.name.replace(/\s/g, '')}Bot/1.0; +${siteConfig.url})`,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError.name === "AbortError") {
        return NextResponse.json({
          success: true,
          verified: false,
          message: "Request timed out. Your website may be slow or blocking requests.",
          details: {
            checked_url: websiteUrl,
            error: "timeout",
          },
        });
      }

      return NextResponse.json({
        success: true,
        verified: false,
        message: "Could not access your website. Please ensure it's publicly accessible.",
        details: {
          checked_url: websiteUrl,
          error: fetchError.message,
        },
      });
    }

    // Check response status
    if (!response.ok) {
      return NextResponse.json({
        success: true,
        verified: false,
        message: `Website returned error status: ${response.status}`,
        details: {
          checked_url: websiteUrl,
          status_code: response.status,
        },
      });
    }

    // Get HTML content
    const html = await response.text();

    // Search for <a> tags with href to the platform domain
    // We need to find the entire <a> tag to check for nofollow
    const anchorTagPattern = new RegExp(`<a\\s+[^>]*href\\s*=\\s*["']https?:\\/\\/(www\\.)?${escapedDomain}\\/?[^"']*["'][^>]*>`, 'gi');
    const anchorMatches = html.match(anchorTagPattern);

    let linkFound = false;
    let hasDofollow = false;
    let hasNofollow = false;
    let matchedTag = null;

    if (anchorMatches && anchorMatches.length > 0) {
      linkFound = true;

      // Check each matched anchor tag for nofollow
      for (const tag of anchorMatches) {
        matchedTag = tag;

        // Check if the tag contains rel attribute with nofollow
        const relMatch = tag.match(/rel\s*=\s*["']([^"']*)["']/i);

        if (relMatch) {
          const relValue = relMatch[1].toLowerCase();
          if (relValue.includes("nofollow")) {
            hasNofollow = true;
          } else {
            // Has rel but no nofollow - this is dofollow
            hasDofollow = true;
            break;
          }
        } else {
          // No rel attribute means dofollow by default
          hasDofollow = true;
          break;
        }
      }
    }

    // Also check for badge images from the platform domain
    if (!linkFound) {
      const imgPattern = new RegExp(`src\\s*=\\s*["']https?:\\/\\/(www\\.)?${escapedDomain}[^"']*["']`, 'gi');
      const imgMatch = html.match(imgPattern);
      if (imgMatch && imgMatch.length > 0) {
        // Image found but no link - partial verification
        return NextResponse.json({
          success: true,
          verified: false,
          message:
            `Badge image found, but no clickable link to ${siteDomain}. Please ensure the badge is wrapped in an <a> tag linking to ${siteDomain}.`,
          details: {
            checked_url: websiteUrl,
            image_found: true,
            link_found: false,
          },
        });
      }
    }

    if (linkFound && hasDofollow) {
      return NextResponse.json({
        success: true,
        verified: true,
        message: `Badge verified! Dofollow link to ${siteDomain} found on your website.`,
        details: {
          checked_url: websiteUrl,
          link_found: true,
          is_dofollow: true,
          matched_tag: matchedTag,
        },
      });
    } else if (linkFound && hasNofollow && !hasDofollow) {
      return NextResponse.json({
        success: true,
        verified: false,
        message:
          `Link to ${siteDomain} found, but it has rel="nofollow". Please remove the nofollow attribute to get a dofollow backlink.`,
        details: {
          checked_url: websiteUrl,
          link_found: true,
          is_dofollow: false,
          has_nofollow: true,
          matched_tag: matchedTag,
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        verified: false,
        message:
          `Link to ${siteDomain} not found on your homepage. Please add the badge and try again.`,
        details: {
          checked_url: websiteUrl,
          link_found: false,
        },
      });
    }
  } catch (error) {
    console.error("Badge verification error:", error);
    return NextResponse.json(
      {
        success: false,
        verified: false,
        message: "An error occurred during verification. Please try again.",
      },
      { status: 500 }
    );
  }
}
