import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase/database';
import { featureGuard } from '@/lib/features';
import { sendEmail } from '@/lib/email';
import { advertisingConfig } from '@/config/advertising.config';

const DAY_MS = 86_400_000;
/** Long after any checkout could still complete. */
const ABANDONED_AFTER_MS = DAY_MS;

/**
 * Daily: warn advertisers before their spot ends and tidy finished rows.
 * Nothing here decides what is shown: the public API stops serving an ad at
 * `ends_at` on its own, so a missed run only delays the email and the status.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const guard = featureGuard('promotions');
  if (guard) return guard;

  const now = new Date();
  const results = { reminded: 0, expired: 0, abandoned: 0, failed: 0 };

  try {
    const reminderCutoff = new Date(
      now.getTime() + advertisingConfig.promotions.reminderDaysBefore * DAY_MS
    );
    // The db layer applies one operator per column, so the lower bound is checked here.
    const ending = await db.find(
      'promotions',
      {
        status: 'active',
        is_house: false,
        reminder_sent_at: { $exists: false },
        ends_at: { $lte: reminderCutoff.toISOString() },
      },
      { limit: 100 }
    );

    for (const promotion of ending) {
      if (new Date(promotion.ends_at) <= now) continue;
      try {
        const user = await db.findOne('users', { id: promotion.user_id });
        if (!user?.email) {
          results.failed++;
          console.error('Ad reminder: no email for promotion', promotion.id);
          continue;
        }
        const sent = await sendEmail(
          user.email,
          'adPlacementEnding',
          { projectName: promotion.name, endsAt: promotion.ends_at, clicks: promotion.clicks ?? 0 },
          { idempotencyKey: `ad-ending-${promotion.id}` }
        );
        if (!sent?.success) {
          results.failed++;
          console.error('Ad reminder failed:', promotion.id, sent?.error);
          continue;
        }
        await db.updateOne(
          'promotions',
          { id: promotion.id },
          { $set: { reminder_sent_at: new Date() } }
        );
        results.reminded++;
      } catch (error) {
        results.failed++;
        console.error('Ad reminder failed:', promotion.id, error);
      }
    }

    const finished = await db.find(
      'promotions',
      { status: 'active', ends_at: { $lte: now.toISOString() } },
      { limit: 200 }
    );
    for (const promotion of finished) {
      await db.updateOne('promotions', { id: promotion.id }, { $set: { status: 'expired' } });
      results.expired++;
    }

    const abandoned = await db.find(
      'promotions',
      {
        status: 'pending',
        created_at: { $lt: new Date(now.getTime() - ABANDONED_AFTER_MS).toISOString() },
      },
      { limit: 200 }
    );
    for (const promotion of abandoned) {
      await db.updateOne('promotions', { id: promotion.id }, { $set: { status: 'expired' } });
      results.abandoned++;
    }

    return NextResponse.json(results, { status: results.failed ? 503 : 200 });
  } catch (error) {
    console.error('Ad placement cron failed:', error);
    return NextResponse.json({ ...results, error: 'Cron failed' }, { status: 503 });
  }
}
