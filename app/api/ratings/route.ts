import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/supabase/database";
import { featureGuard } from "@/lib/features";

// POST /api/ratings - Create or update a rating
export async function POST(request: Request) {
  try {
    const guard = featureGuard("ratings");
    if (guard) return guard;

    const { checkRateLimit, createRateLimitResponse } = await import("@/lib/rate-limit");
    const rateLimitResult = await checkRateLimit(request, "general");
    if (!rateLimitResult.allowed) {
      const rateLimitResponse = createRateLimitResponse(rateLimitResult);
      return new NextResponse(rateLimitResponse.body, {
        status: rateLimitResponse.status,
        headers: rateLimitResponse.headers,
      });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { app_id, rating } = body;

    if (!app_id) {
      return NextResponse.json({ error: "app_id is required" }, { status: 400 });
    }
    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be an integer between 1 and 5" }, { status: 400 });
    }

    // Check that the user is not rating their own project
    const app = await db.findOne("apps", { id: app_id });
    if (!app) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (app.submitted_by === user.id) {
      return NextResponse.json({ error: "You cannot rate your own project" }, { status: 403 });
    }

    // One rating per user per project — no updates allowed
    const alreadyRated = NextResponse.json(
      { error: "You have already rated this project", code: "already_rated" },
      { status: 409 }
    );
    const existing = await db.findOne("ratings", { user_id: user.id, app_id });
    if (existing) return alreadyRated;

    try {
      await db.insertOne("ratings", { user_id: user.id, app_id, rating });
    } catch (insertError: any) {
      // UNIQUE(user_id, app_id): a double tap raced past the check above
      if (/duplicate key|23505/i.test(String(insertError?.message))) return alreadyRated;
      throw insertError;
    }

    // The rating is saved; from here on nothing may turn this into an error,
    // or the client shows "failed" for a rating that exists and the retry
    // gets "already rated". Databases built from the migrations keep the
    // aggregates in sync with a trigger (refresh_app_rating_aggregates) and
    // have no recalculate_app_rating; schema.sql installs have the function.
    await db
      .rpc("recalculate_app_rating", { target_app_id: app_id })
      .catch(() => db.rpc("refresh_app_rating_aggregates", { p_app_id: app_id }))
      .catch((aggError) => console.error("Rating saved, aggregate refresh failed:", aggError));

    // Fetch updated stats
    const updatedApp = await db.findOne("apps", { id: app_id }).catch(() => null);

    return NextResponse.json({
      success: true,
      data: {
        rating,
        average_rating: updatedApp?.average_rating || 0,
        ratings_count: updatedApp?.ratings_count || 0,
      },
    });
  } catch (error: any) {
    console.error("Error submitting rating:", error);
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
  }
}
