import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../libs/supabase.js";
import { notificationManager } from "../../../libs/notification-service.js";

// This cron job sends account creation notifications to new users
// It runs every hour to catch users who signed up but didn't get the welcome email
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
      notifications_sent: 0,
      errors: [],
    };

    const supabaseAdmin = getSupabaseAdmin();

    // Find users created in the last hour who haven't received welcome emails
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get recent users from Supabase Auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (authError) {
      throw authError;
    }

    const recentUsers = authUsers.users.filter(user => {
      const createdAt = new Date(user.created_at);
      return createdAt >= oneHourAgo;
    });

    console.log(`Found ${recentUsers.length} recent users to check for welcome emails`);

    for (const authUser of recentUsers) {
      try {
        // Check if we've already sent a welcome email
        const existingNotification = await supabaseAdmin
          .from('email_notifications')
          .select('id')
          .eq('user_id', authUser.id)
          .eq('email_type', 'account_creation')
          .eq('status', 'sent')
          .single();

        if (existingNotification.data) {
          console.log(`Skipping ${authUser.email} - welcome email already sent`);
          continue;
        }

        // Get user profile data
        const { data: userProfile, error: profileError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError) {
          console.log(`Skipping ${authUser.email} - no profile found`);
          continue;
        }

        // Send account creation notification
        await notificationManager.sendAccountCreationNotification({
          id: authUser.id,
          email: authUser.email,
          full_name: userProfile.full_name || authUser.user_metadata?.name,
          first_name: userProfile.first_name || authUser.user_metadata?.name?.split(' ')[0]
        });

        results.notifications_sent++;
        console.log(`📧 Welcome email sent to ${authUser.email}`);

      } catch (error) {
        console.error(`Failed to send welcome email to ${authUser.email}:`, error);
        results.errors.push({
          email: authUser.email,
          error: error.message
        });
      }
    }

    console.log(`Account notification cron completed: ${results.notifications_sent} welcome emails sent`);

    return NextResponse.json({
      success: true,
      message: `Account notification cron completed successfully`,
      data: results
    });

  } catch (error) {
    console.error("Account notification cron error:", error);
    return NextResponse.json(
      { 
        error: "Account notification cron failed", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
