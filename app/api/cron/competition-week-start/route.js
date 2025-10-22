import { NextResponse } from "next/server";
import { db } from "../../../../libs/database.js";
import { notificationManager } from "../../../../libs/notification-service.js";
import { getSupabaseAdmin } from "../../../../libs/supabase.js";

// This cron job sends competition week start notifications to newsletter subscribers
// It runs when a new competition week starts (Monday 8 AM UTC)
// Sends promotional emails featuring premium launches

export async function GET(request) {
  try {
    // Verify cron execution: allow either Vercel Scheduled Function header or Bearer secret
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    const authHeader = request.headers.get('authorization');
    const hasBearer = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    if (!isVercelCron && !hasBearer) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const results = {
      timestamp: now.toISOString(),
      notificationsSent: 0,
      errors: [],
    };

    // Find the active competition for this week
    const activeCompetition = await db.findOne('competitions', {
      status: 'active',
      start_date: { $lte: now },
      end_date: { $gt: now },
    });

    if (!activeCompetition) {
      return NextResponse.json({
        success: true,
        message: 'No active competition found',
        results,
      });
    }

    // Get featured projects for this week (premium projects first, then by upvotes)
    const featuredProjects = await db.find(
      'apps',
      {
        weekly_competition_id: activeCompetition.id,
        status: 'live',
      },
      {
        sort: { premium_badge: -1, upvotes: -1, created_at: -1 },
        limit: 10
      }
    );

    if (featuredProjects.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No featured projects found for this week',
        results,
      });
    }

    // Get newsletter subscribers who have opted in to competition updates
    const supabase = getSupabaseAdmin();
    const { data: subscribers, error } = await supabase
      .from('newsletter')
      .select('email, preferences')
      .eq('status', 'subscribed')
      .not('preferences->competition_updates', 'eq', false);

    if (error) {
      console.error('Error fetching newsletter subscribers:', error);
      results.errors.push({
        step: 'fetch_subscribers',
        error: error.message,
      });
    } else {
      // Send notifications to subscribers
      for (const subscriber of subscribers || []) {
        try {
          await notificationManager.sendCompetitionWeekStartNotification({
            userEmail: subscriber.email,
            competition: activeCompetition,
            featuredProjects: featuredProjects,
          });
          results.notificationsSent++;
        } catch (notificationError) {
          console.error(`Failed to send competition week start notification to ${subscriber.email}:`, notificationError);
          results.errors.push({
            email: subscriber.email,
            error: notificationError.message,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Competition week start notifications completed',
      results,
    });

  } catch (error) {
    console.error('Competition week start cron job error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}
