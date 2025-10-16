import { NextResponse } from "next/server";
import { db } from "../../../libs/database.js";
import { notificationManager } from "../../../libs/notification-service.js";

// This cron job sends reminders to winners who haven't added their badge yet
// It runs daily to remind winners about their dofollow link opportunity
export async function GET(request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const results = {
      timestamp: now.toISOString(),
      reminders_sent: 0,
      errors: [],
    };

    // Find winners who need reminders
    // Winners who:
    // 1. Have dofollow_status = true
    // 2. Have dofollow_reason = 'weekly_winner'
    // 3. Won within the last 7 days
    // 4. Haven't been reminded in the last 24 hours
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const winnersNeedingReminders = await db.find("apps", {
      dofollow_status: true,
      dofollow_reason: "weekly_winner",
      dofollow_awarded_at: { $gte: sevenDaysAgo, $lte: oneDayAgo },
      // We'll check if they've been reminded recently by looking at email_notifications
    });

    console.log(`Found ${winnersNeedingReminders.length} winners needing reminders`);

    for (const winner of winnersNeedingReminders) {
      try {
        // Check if we've already sent a reminder in the last 24 hours
        const recentReminder = await db.findOne("email_notifications", {
          user_id: winner.submitted_by,
          email_type: "winner_reminder",
          app_id: winner.id,
          created_at: { $gte: oneDayAgo },
          status: "sent"
        });

        if (recentReminder) {
          console.log(`Skipping ${winner.name} - reminder already sent recently`);
          continue;
        }

        // Get user data
        const user = await db.findOne("users", { id: winner.submitted_by });
        if (!user || !user.email) {
          console.log(`Skipping ${winner.name} - no user email found`);
          continue;
        }

        // Send winner reminder notification
        await notificationManager.sendWinnerReminderNotification({
          userId: user.id,
          userEmail: user.email,
          directory: {
            id: winner.id,
            name: winner.name,
            slug: winner.slug
          },
          position: winner.weekly_position
        });

        results.reminders_sent++;
        console.log(`📧 Winner reminder sent to ${user.email} for ${winner.name}`);

      } catch (error) {
        console.error(`Failed to send reminder for ${winner.name}:`, error);
        results.errors.push({
          winner: winner.name,
          error: error.message
        });
      }
    }

    console.log(`Winner reminder cron completed: ${results.reminders_sent} reminders sent`);

    return NextResponse.json({
      success: true,
      message: `Winner reminder cron completed successfully`,
      data: results
    });

  } catch (error) {
    console.error("Winner reminder cron error:", error);
    return NextResponse.json(
      { 
        error: "Winner reminder cron failed", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
