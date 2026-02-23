import { NextResponse } from "next/server";
import { db } from "../../../libs/database.js";
import { notificationManager } from "../../../libs/notification-service.js";
import { getSupabaseAdmin } from "../../../libs/supabase.js";

// One-off cron to send backlink reminders to ALL past winners
// Use this once manually (or via a temporary scheduled job) to ping
// every historical winner who still has dofollow_status=true and
// hasn't verified their backlink yet.
//
// Auth:
//  - x-vercel-cron: 1 (for Vercel scheduled functions)
//  - or Authorization: Bearer <CRON_SECRET>
//
// Effect:
//  - Finds all apps with:
//      weekly_winner: true
//      dofollow_status: true
//      dofollow_reason: 'weekly_winner'
//      backlink_verified !== true
//  - Skips apps where a 'winner_backlink_reminder' email_notification
//    already exists for that user + app (prevents duplicate sends)
//  - Sends the existing winner_backlink_reminder email, which already
//    tells them:
//      - They need to add the winner badge with a dofollow backlink
//      - They can grab the embed badges from their dashboard
export async function GET(request) {
  try {
    // Verify cron execution: allow either Vercel Scheduled Function header or Bearer secret
    const isVercelCron = request.headers.get("x-vercel-cron") === "1";
    const authHeader = request.headers.get("authorization");
    const hasBearer = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isVercelCron && !hasBearer) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const supabaseAdmin = getSupabaseAdmin();
    const results = {
      timestamp: now.toISOString(),
      remindersSent: 0,
      skippedAlreadyReminded: 0,
      skippedNoUserEmail: 0,
      errors: [],
    };

    // Find ALL historical winners who:
    //  - still have dofollow active for weekly_winner
    //  - have NOT verified their backlink yet
    const winners = await db.find("apps", {
      weekly_winner: true,
      dofollow_status: true,
      dofollow_reason: "weekly_winner",
      backlink_verified: { $ne: true },
    });

    if (!winners || winners.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No historical winners need backlink reminders",
        results,
      });
    }

    for (const winner of winners) {
      try {
        // Make sure we don't send this reminder twice for the same user+project
        const existingReminder = await db.findOne("email_notifications", {
          user_id: winner.submitted_by,
          email_type: "winner_backlink_reminder",
          app_id: winner.id,
        });

        if (existingReminder) {
          results.skippedAlreadyReminded++;
          continue;
        }

        // Load user email from Supabase auth (source of truth for emails)
        const { data: authUserResult, error: authError } =
          await supabaseAdmin.auth.admin.getUserById(winner.submitted_by);

        if (authError) {
          console.error(
            `Failed to load auth user for ${winner.submitted_by}:`,
            authError
          );
        }

        const authUser = authUserResult?.user;
        const userEmail = authUser?.email;

        if (!userEmail) {
          results.skippedNoUserEmail++;
          continue;
        }

        // For this one-off historical cron, always give winners a fresh 7-day window
        // instead of calculating relative to the original dofollow_awarded_at date.
        // The regular weekly reminder cron still uses the dynamic calculation.
        const daysLeft = 7;

        await notificationManager.sendWinnerBacklinkReminderNotification({
          userId: winner.submitted_by,
          userEmail,
          project: {
            id: winner.id,
            name: winner.name,
            slug: winner.slug,
          },
          position: winner.weekly_position,
          daysLeft,
        });

        results.remindersSent++;
      } catch (error) {
        console.error(
          `Failed to send historical backlink reminder for winner ${winner.name}:`,
          error
        );
        results.errors.push({
          project_id: winner.id,
          project_name: winner.name,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Historical winner backlink reminders completed (one-off run endpoint)",
      results,
    });
  } catch (error) {
    console.error("Historical winner backlink reminders cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
