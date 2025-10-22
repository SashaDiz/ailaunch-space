import { NextResponse } from "next/server";
import { db } from "../../../libs/database.js";
import { notificationManager } from "../../../libs/notification-service.js";
import { getSupabaseAdmin } from "../../../libs/supabase.js";

// This cron job sends competition week end notifications to newsletter subscribers
// It runs when a competition week ends (Sunday 11:59 PM PST / Monday 7:59 AM UTC)
// Sends promotional emails featuring the winners

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

    // Find competitions that just ended (within the last hour)
    const recentlyEndedCompetitions = await db.find('competitions', {
      status: 'completed',
      completed_at: { $gte: new Date(now.getTime() - 60 * 60 * 1000) }, // Within last hour
    });

    if (recentlyEndedCompetitions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No recently ended competitions found',
        results,
      });
    }

    // Process each recently ended competition
    for (const competition of recentlyEndedCompetitions) {
      try {
        // Get winners for this competition
        const winners = await db.find(
          'apps',
          {
            weekly_competition_id: competition.id,
            weekly_winner: true,
          },
          {
            sort: { weekly_position: 1 },
          }
        );

        if (winners.length === 0) {
          continue; // Skip if no winners
        }

        // Calculate total stats
        const totalVotes = await db.aggregate('votes', [
          { $match: { weekly_competition_id: competition.id } },
          { $count: 'total' }
        ]);
        
        const totalProjects = await db.count('apps', {
          weekly_competition_id: competition.id,
          status: 'live',
        });

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
              await notificationManager.sendCompetitionWeekEndNotification({
                userEmail: subscriber.email,
                competition: competition,
                winners: winners,
                totalVotes: totalVotes[0]?.total || 0,
                totalProjects: totalProjects,
              });
              results.notificationsSent++;
            } catch (notificationError) {
              console.error(`Failed to send competition week end notification to ${subscriber.email}:`, notificationError);
              results.errors.push({
                email: subscriber.email,
                error: notificationError.message,
              });
            }
          }
        }
      } catch (competitionError) {
        console.error(`Error processing competition ${competition.competition_id}:`, competitionError);
        results.errors.push({
          competition_id: competition.competition_id,
          error: competitionError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Competition week end notifications completed',
      results,
    });

  } catch (error) {
    console.error('Competition week end cron job error:', error);
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
