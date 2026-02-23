import { NextResponse } from "next/server";
import { getSession } from "../../../libs/auth-supabase.js";
import { db } from "../../../libs/database.js";
import { getTodayInTimezone } from "../../../libs/streaks.js";

/**
 * GET /api/vote/check-today
 * Check if the authenticated user has voted for any project today
 * Returns: { hasVotedToday: boolean, timezone: string }
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          hasVotedToday: false,
          authenticated: false,
          error: "Authentication required" 
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user to check their timezone
    const user = await db.findOne("users", { id: userId });
    
    if (!user) {
      return NextResponse.json(
        { 
          hasVotedToday: false,
          authenticated: true,
          error: "User not found" 
        },
        { status: 404 }
      );
    }

    // Get user's timezone (stored value or default to UTC)
    const timezone = user.timezone || 'UTC';
    
    // Get today's date in the user's timezone
    const today = getTodayInTimezone(timezone);

    // Check if user has voted today
    let hasVotedToday = false;
    try {
      const todayVote = await db.findOne('daily_votes', {
        user_id: userId,
        vote_date: today,
      });
      
      hasVotedToday = !!todayVote;
    } catch (error) {
      console.error('Error checking daily_votes:', {
        userId,
        today,
        error: error.message,
        stack: error.stack
      });
      // If table doesn't exist or query fails, assume user hasn't voted
      hasVotedToday = false;
    }

    return NextResponse.json({
      hasVotedToday,
      authenticated: true,
      timezone,
      today
    });

  } catch (error) {
    console.error('Error checking vote status:', error);
    return NextResponse.json(
      { 
        hasVotedToday: false,
        authenticated: false,
        error: "Internal server error" 
      },
      { status: 500 }
    );
  }
}
