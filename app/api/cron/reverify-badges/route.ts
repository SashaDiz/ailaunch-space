import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase/database';
import { featureGuard } from '@/lib/features';
import { verifyBadgeOnUrl } from '@/lib/badge-verifier';
import {
  badgeEligibility,
  badgeRevokedEligibility,
  reverifyBadge,
  type BadgeCheckOutcome,
} from '@/lib/badge-reverification';
import { sendEmail } from '@/lib/email';

export const maxDuration = 300;

/**
 * Daily: check every badge-backed Standard listing, start a 7-day grace period
 * when the badge is gone, revoke dofollow after it, restore it when the badge
 * returns. Email is best effort and never blocks enforcement.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const guard = featureGuard('badges');
  if (guard) return guard;

  const startedAt = Date.now();
  // Fetch sites concurrently, but space email sends to avoid provider bursts.
  let emailQueue = Promise.resolve();
  const notify = (kind, listing, email, data, idempotencyKey) => {
    const pending = emailQueue.then(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return sendEmail(email, kind, {
        projectName: listing.name,
        ...(data.deadline ? { deadline: data.deadline.toISOString() } : {}),
      }, { idempotencyKey });
    });
    emailQueue = pending.then(() => undefined, () => undefined);
    return pending;
  };

  const results: Record<BadgeCheckOutcome | 'checked' | 'failed', number> & { complete: boolean } = {
    checked: 0, verified: 0, warned: 0, grace: 0, revoked: 0, restored: 0, still_revoked: 0,
    inconclusive: 0, skipped: 0, failed: 0, complete: true,
  };

  try {
    for (const filter of [badgeEligibility, badgeRevokedEligibility]) {
      // Keyset pagination stays stable while listings change state during the run.
      let cursor: string | undefined;
      while (results.complete) {
        const projects = await db.find('apps', {
          ...filter,
          ...(cursor ? { id: { $gt: cursor } } : {}),
        }, { sort: { id: 1 }, limit: 100, projection: { id: 1 } });
        if (!projects.length) break;
        for (let index = 0; index < projects.length; index += 5) {
          if (Date.now() - startedAt > 260_000) {
            results.complete = false;
            break;
          }
          await Promise.all(projects.slice(index, index + 5).map(async (project) => {
            results.checked++;
            try {
              const outcome = await reverifyBadge(project.id, { db, verify: verifyBadgeOnUrl, notify });
              results[outcome]++;
            } catch (error) {
              results.failed++;
              console.error('Daily badge check failed:', project.id, error);
            }
          }));
        }
        cursor = projects[projects.length - 1].id;
      }
    }
    const success = results.complete && results.failed === 0;
    if (!success) console.error('Daily badge check incomplete:', results);
    return NextResponse.json({ success, results }, { status: success ? 200 : 503 });
  } catch (error) {
    console.error('Failed to run daily badge checks:', error);
    return NextResponse.json({ error: 'Failed to run daily badge checks' }, { status: 500 });
  }
}
