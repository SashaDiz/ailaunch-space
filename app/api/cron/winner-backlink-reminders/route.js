import { NextResponse } from "next/server";
import { db } from "../../../../libs/database.js";
import { notificationManager } from "../../../../libs/notification-service.js";

// This cron job sends winner backlink reminder notifications
// It runs daily to check for winners who haven't added their backlink badge
// Sends final reminders when time is running out

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
      remindersSent: 0,
      errors: [],
    };

    // Find winners who haven't added their backlink badge yet
    // Check for winners from the past 7 days who still have dofollow_status = true
    // but haven't verified their backlink
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const winnersNeedingReminders = await db.find('apps', {
      weekly_winner: true,
      dofollow_status: true,
      dofollow_reason: 'weekly_winner',
      dofollow_awarded_at: { $gte: sevenDaysAgo },
      backlink_verified: { $ne: true }, // Haven't verified their backlink yet
    });

    if (winnersNeedingReminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No winners need backlink reminders',
        results,
      });
    }

    // Send reminders to winners
    for (const winner of winnersNeedingReminders) {
      try {
        // Calculate days left
        const awardedDate = new Date(winner.dofollow_awarded_at);
        const daysLeft = Math.max(0, 7 - Math.floor((now - awardedDate) / (1000 * 60 * 60 * 24)));

        // Only send reminder if there are days left
        if (daysLeft > 0) {
          const user = await db.findOne('users', { id: winner.submitted_by });
          if (user && user.email) {
            await notificationManager.sendWinnerBacklinkReminderNotification({
              userId: user.id,
              userEmail: user.email,
              project: {
                id: winner.id,
                name: winner.name,
                slug: winner.slug
              },
              position: winner.weekly_position,
              daysLeft: daysLeft,
            });
            results.remindersSent++;
          }
        }
      } catch (reminderError) {
        console.error(`Failed to send backlink reminder for winner ${winner.name}:`, reminderError);
        results.errors.push({
          project_id: winner.id,
          project_name: winner.name,
          error: reminderError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Winner backlink reminders completed',
      results,
    });

  } catch (error) {
    console.error('Winner backlink reminders cron job error:', error);
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
