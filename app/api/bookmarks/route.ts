import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { db } from "@/lib/supabase/database";
import { featureGuard } from "@/lib/features";

// GET /api/bookmarks - Get current user's bookmarked projects
export async function GET(request: Request) {
  try {
    const guard = featureGuard("bookmarks");
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
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const bookmarks = await db.find("bookmarks", { user_id: user.id }, {
      sort: { created_at: -1 },
      limit,
      skip,
    });

    if (bookmarks.length === 0) {
      return NextResponse.json({ success: true, data: { projects: [], total: 0 } });
    }

    const appIds = bookmarks.map((b: any) => b.app_id);
    const projects = await db.find("apps", { id: { $in: appIds }, status: "live" });
    const total = await db.count("bookmarks", { user_id: user.id });

    return NextResponse.json({ success: true, data: { projects, total, page, limit } });
  } catch (error: any) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}

// POST /api/bookmarks - Add a bookmark
export async function POST(request: Request) {
  try {
    const guard = featureGuard("bookmarks");
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
    const { app_id } = body;
    if (!app_id) {
      return NextResponse.json({ error: "app_id is required" }, { status: 400 });
    }

    // Check if already bookmarked
    const existing = await db.findOne("bookmarks", { user_id: user.id, app_id });
    if (existing) {
      return NextResponse.json({ success: true, message: "Already bookmarked" });
    }

    await db.insertOne("bookmarks", { user_id: user.id, app_id });
    await db.updateOne("apps", { id: app_id }, { $inc: { bookmarks_count: 1 } });

    return NextResponse.json({ success: true, message: "Bookmarked" });
  } catch (error: any) {
    console.error("Error adding bookmark:", error);
    return NextResponse.json({ error: "Failed to add bookmark" }, { status: 500 });
  }
}

// DELETE /api/bookmarks - Remove a bookmark
export async function DELETE(request: Request) {
  try {
    const guard = featureGuard("bookmarks");
    if (guard) return guard;

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

    const { searchParams } = new URL(request.url);
    const app_id = searchParams.get("app_id");
    if (!app_id) {
      return NextResponse.json({ error: "app_id is required" }, { status: 400 });
    }

    const result = await db.deleteOne("bookmarks", { user_id: user.id, app_id });
    if (result.deletedCount > 0) {
      await db.updateOne("apps", { id: app_id }, { $inc: { bookmarks_count: -1 } });
    }

    return NextResponse.json({ success: true, message: "Bookmark removed" });
  } catch (error: any) {
    console.error("Error removing bookmark:", error);
    return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 });
  }
}
