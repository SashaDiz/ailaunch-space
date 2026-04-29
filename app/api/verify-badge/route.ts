import { NextResponse } from 'next/server';
import { featureGuard } from '@/lib/features';
import { db } from '@/lib/supabase/database';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { describeOutcome, verifyBadgeOnUrl } from '@/lib/badge-verifier';

/**
 * POST /api/verify-badge
 * Body: { websiteUrl: string, projectId?: string }
 *
 * Fetches the user's site, checks for an `<a>` tag pointing at our domain
 * with no `rel="nofollow"`. On success and when `projectId` is supplied,
 * stamps `backlink_verified=true` on the project. Does NOT flip `link_type`
 * — that happens at admin approval time.
 */
export async function POST(request: Request) {
  const guard = featureGuard('badges');
  if (guard) return guard;

  const rateLimit = await checkRateLimit(request, 'submission');
  if (!rateLimit.allowed) return createRateLimitResponse(rateLimit);

  let body: { websiteUrl?: string; projectId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, verified: false, message: 'Malformed JSON body.' },
      { status: 400 }
    );
  }

  const { websiteUrl, projectId } = body;
  if (!websiteUrl) {
    return NextResponse.json(
      { success: false, verified: false, message: 'Website URL is required' },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await verifyBadgeOnUrl(websiteUrl);
  } catch (error) {
    console.error('Badge verification error:', error);
    return NextResponse.json(
      { success: false, verified: false, message: 'An error occurred during verification. Please try again.' },
      { status: 500 }
    );
  }

  const summary = describeOutcome(result);

  if (summary.verified && projectId) {
    try {
      await db.updateOne(
        'apps',
        { id: projectId },
        {
          $set: {
            backlink_verified: true,
            backlink_verified_at: new Date(),
            backlink_last_checked_at: new Date(),
            backlink_url: result.checkedUrl,
          },
        }
      );
    } catch (error) {
      console.error('Failed to persist backlink_verified for project', projectId, error);
    }
  } else if (!summary.verified && projectId) {
    try {
      await db.updateOne(
        'apps',
        { id: projectId },
        { $set: { backlink_last_checked_at: new Date() } }
      );
    } catch (error) {
      console.error('Failed to stamp backlink_last_checked_at for project', projectId, error);
    }
  }

  const status = result.outcome.kind === 'invalid_url' ? 400 : 200;
  return NextResponse.json(
    { success: status === 200, verified: summary.verified, message: summary.message, details: summary.details },
    { status }
  );
}
