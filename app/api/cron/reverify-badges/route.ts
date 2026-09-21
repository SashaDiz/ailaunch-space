import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase/database';
import { featureGuard } from '@/lib/features';
import { verifyBadgeOnUrl } from '@/lib/badge-verifier';
import { badgeEligibility, reverifyBadge } from '@/lib/badge-reverification';
import { sendEmail } from '@/lib/email';

export const maxDuration = 300;

/** Weekly: warn once, allow seven days, then re-check before archiving. */
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
  const warn = (listing, email, deadline, idempotencyKey) => {
    const pending = emailQueue.then(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return sendEmail(email, 'badgeRemoved', {
        projectName: listing.name,
        deadline: deadline.toISOString(),
      }, { idempotencyKey });
    });
    emailQueue = pending.then(() => undefined, () => undefined);
    return pending;
  };
  const results = { checked: 0, verified: 0, warned: 0, archived: 0, grace: 0,
    inconclusive: 0, skipped: 0, failed: 0, complete: true };
  try {
    // Keyset pagination remains stable while projects are archived during this run.
    let cursor: string | undefined;
    while (true) {
      const projects = await db.find('apps', {
        ...badgeEligibility,
        ...(cursor ? { id: { $gt: cursor } } : {}),
      }, { sort: { id: 1 }, limit: 100 });
      if (!projects.length) break;
      for (let index = 0; index < projects.length; index += 5) {
        if (Date.now() - startedAt > 260_000) {
          results.complete = false;
          break;
        }
        await Promise.all(projects.slice(index, index + 5).map(async (project) => {
          results.checked++;
          try {
            const outcome = await reverifyBadge(project.id, {
              db,
              verify: verifyBadgeOnUrl,
              warn,
            });
            results[outcome]++;
          } catch (error) {
            results.failed++;
            console.error('Weekly badge check failed:', project.id, error);
          }
        }));
      }
      if (!results.complete) break;
      cursor = projects[projects.length - 1].id;
    }
    const success = results.complete && results.failed === 0;
    if (!success) console.error('Weekly badge check incomplete:', results);
    return NextResponse.json({ success, results }, { status: success ? 200 : 503 });
  } catch (error) {
    console.error('Failed to run weekly badge checks:', error);
    return NextResponse.json({ error: 'Failed to run weekly badge checks' }, { status: 500 });
  }
}
