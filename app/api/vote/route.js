import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../libs/supabase.js";
import { db } from "../../libs/database.js";
import { validateVote } from "../../libs/models/schemas.js";
import { checkRateLimit, createRateLimitResponse, addSecurityHeaders, validation } from "../../libs/rateLimit.js";
import { webhookEvents } from "../../libs/webhooks.js";
import { getSession } from "../../libs/auth-supabase.js";

// POST /api/vote - Submit or remove a vote
export async function POST(request) {
  try {
    // Check rate limit first
    const rateLimitResult = await checkRateLimit(request, 'voting');
    if (!rateLimitResult.allowed) {
      const rateLimitResponse = createRateLimitResponse(rateLimitResult);
      return new NextResponse(rateLimitResponse.body, {
        status: rateLimitResponse.status,
        headers: rateLimitResponse.headers,
      });
    }

    // Check authentication
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: "Authentication required. Please sign in to vote.", 
          code: "UNAUTHORIZED",
          message: "You must be logged in to vote for directories."
        },
        { status: 401 }
      );
    }
    
    // Log authentication success for debugging
    console.log('Vote API - User authenticated:', {
      userId: session.user.id,
      email: session.user.email
    });

    const body = await request.json();
    const { appId, action } = body; // action: 'upvote' or 'remove'

    if (!appId || !action) {
      return NextResponse.json(
        { error: "App ID and action are required", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    if (!["upvote", "remove"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'upvote' or 'remove'", code: "INVALID_ACTION" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Get the app to verify it exists and get competition info
    const app = await db.findOne("apps", { id: appId });
    if (!app) {
      return NextResponse.json(
        { error: "Directory not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // VOTING RESTRICTION: Only allow voting for "live" submissions
    if (app.status !== "live") {
      return NextResponse.json(
        { 
          error: "Voting is only allowed for live submissions", 
          code: "INVALID_STATUS",
          message: `This submission is currently "${app.status}". Only submissions with status "live" can receive votes.`
        },
        { status: 403 }
      );
    }

    // VOTING RESTRICTION: Only allow voting for submissions in active competitions
    if (!app.weekly_competition_id) {
      return NextResponse.json(
        { 
          error: "This submission is not part of any competition", 
          code: "NO_COMPETITION",
          message: "Voting is only allowed for submissions participating in the current launch week."
        },
        { status: 403 }
      );
    }

    // Verify the competition is currently active AND running (between start and end dates)
    const competition = await db.findOne("competitions", { id: app.weekly_competition_id });
    if (!competition) {
      return NextResponse.json(
        { 
          error: "This submission's competition is no longer available", 
          code: "NO_COMPETITION"
        },
        { status: 403 }
      );
    }
    
    const now = new Date();
    const startDate = new Date(competition.start_date);
    const endDate = new Date(competition.end_date);
    
    // Проверяем что конкурс идёт прямо сейчас (статус Live)
    if (now < startDate) {
      return NextResponse.json(
        { 
          error: "Voting will be available when the launch week starts", 
          code: "COMPETITION_NOT_STARTED",
          message: `This launch is scheduled for ${startDate.toLocaleDateString()}. Voting will open on that date.`
        },
        { status: 403 }
      );
    }
    
    if (now > endDate) {
      return NextResponse.json(
        { 
          error: "Voting period has ended for this launch", 
          code: "COMPETITION_ENDED",
          message: `This launch week ended on ${endDate.toLocaleDateString()}. Voting is no longer available.`
        },
        { status: 403 }
      );
    }

    // Check if user already voted
    const existingVote = await db.findOne("votes", {
      user_id: userId,
      app_id: appId,
    });

    let voteChange = 0;

    if (action === "upvote") {
      if (existingVote) {
        return NextResponse.json(
          { error: "Already voted", code: "ALREADY_VOTED" },
          { status: 400 }
        );
      }

      // Create new vote
      const voteData = {
        user_id: userId,
        app_id: appId,
        weekly_competition_id: app.weekly_competition_id, // UUID reference
        vote_type: "upvote",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        // created_at is handled by DB defaults
      };

      await db.insertOne("votes", voteData);
      voteChange = 1;

    } else if (action === "remove") {
      if (!existingVote) {
        return NextResponse.json(
          { error: "No vote to remove", code: "NO_VOTE" },
          { status: 400 }
        );
      }

      // Remove existing vote
      await db.deleteOne("votes", { id: existingVote.id });
      voteChange = -1;
    }

    // Update app vote count atomically to prevent race conditions
    await db.updateOne(
      "apps",
      { id: appId },
      {
        $inc: { upvotes: voteChange },
        $set: { updated_at: new Date() },
      }
    );

    // Update user vote count
    await db.updateOne(
      "users",
      { id: userId },
      {
        $inc: { total_votes: voteChange },
        $set: { updated_at: new Date() },
      }
    );

    // Update competition vote counts if applicable
    if (app.weekly_competition_id) {
      await db.updateOne(
        "competitions",
        { id: app.weekly_competition_id }, // Query by UUID
        {
          $inc: { total_votes: voteChange },
          // updated_at is handled by DB triggers
        }
      );
    }


    // Fetch updated app to get accurate vote count
    const updatedApp = await db.findOne("apps", { id: appId });
    const newVoteCount = updatedApp?.upvotes || 0;

    // Dispatch webhook event for vote cast
    try {
      await webhookEvents.voteCast({
        appId,
        userId: session.user.id,
        action
      });
    } catch (webhookError) {
      console.error("Webhook dispatch failed for vote:", webhookError);
      // Don't fail the vote if webhook fails
    }

    const response = NextResponse.json({
      success: true,
      data: {
        appId,
        action,
        newVoteCount,
        userVoted: action === "upvote",
      },
    });

    return addSecurityHeaders(response);

  } catch (error) {
    console.error("Vote API error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// GET /api/vote?appId=123 - Check if user voted for an app
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("appId");

    if (!appId) {
      return NextResponse.json(
        { error: "App ID is required", code: "MISSING_APP_ID" },
        { status: 400 }
      );
    }

    // Check authentication (optional for GET)
    const session = await getSession();
    let userVoted = false;

    if (session?.user?.id) {
      const existingVote = await db.findOne("votes", {
        user_id: session.user.id,
        app_id: appId,
      });
      userVoted = !!existingVote;
    }

    // Get current vote count
    const app = await db.findOne("apps", { id: appId });
    const voteCount = app?.upvotes || 0;

    return NextResponse.json({
      success: true,
      data: {
        appId,
        voteCount,
        userVoted,
      },
    });

  } catch (error) {
    console.error("Vote check API error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}