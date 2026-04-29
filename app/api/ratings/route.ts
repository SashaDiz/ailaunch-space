import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
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

    const cookieStore = await cookies();
    const supabase = createServerClient(
      getSupabaseUrl()!,
      getSupabasePublishableKey()!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );
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
    const existing = await db.findOne("ratings", { user_id: user.id, app_id });
    if (existing) {
      return NextResponse.json(
        { error: "You have already rated this project" },
        { status: 403 }
      );
    }
    await db.insertOne("ratings", { user_id: user.id, app_id, rating });

    // Recalculate average rating atomically via PostgreSQL function
    await db.rpc("recalculate_app_rating", { target_app_id: app_id });

    // Fetch updated stats
    const updatedApp = await db.findOne("apps", { id: app_id });

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
