import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { db } from "@/lib/supabase/database";
import { featureGuard } from "@/lib/features";

// GET /api/comments - Get comments for a project (optionally merged with ratings)
export async function GET(request: Request) {
  try {
    const guard = featureGuard("comments");
    if (guard) return guard;

    const { searchParams } = new URL(request.url);
    const app_id = searchParams.get("app_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const includeRatings = searchParams.get("include_ratings") === "1";

    if (!app_id) {
      return NextResponse.json({ error: "app_id is required" }, { status: 400 });
    }

    if (includeRatings) {
      const ratingsGuard = featureGuard("ratings");
      if (ratingsGuard) return ratingsGuard;
      // Merged list: one row per user who rated or commented (rating + optional latest comment)
      const [allRatings, allComments] = await Promise.all([
        db.find("ratings", { app_id }, { sort: { created_at: -1 } }),
        db.find("comments", { app_id }, { sort: { created_at: -1 }, limit: 2000 }),
      ]);
      const byUser = new Map<
        string,
        { rating: number | null; ratingAt: string; content: string | null; commentId: string | null; commentAt: string | null; commentUpdatedAt: string | null }
      >();
      for (const r of allRatings) {
        byUser.set(r.user_id, {
          rating: r.rating,
          ratingAt: r.created_at,
          content: null,
          commentId: null,
          commentAt: null,
          commentUpdatedAt: null,
        });
      }
      for (const c of allComments) {
        const cur = byUser.get(c.user_id);
        if (!cur) {
          byUser.set(c.user_id, {
            rating: null,
            ratingAt: "",
            content: c.content,
            commentId: c.id,
            commentAt: c.created_at,
            commentUpdatedAt: c.updated_at || null,
          });
        } else if (!cur.content) {
          cur.content = c.content;
          cur.commentId = c.id;
          cur.commentAt = c.created_at;
          cur.commentUpdatedAt = c.updated_at || null;
        }
      }
      const merged = Array.from(byUser.entries()).map(([user_id, v]) => ({
        user_id,
        rating: v.rating,
        created_at: v.ratingAt && v.commentAt
          ? (v.ratingAt > v.commentAt ? v.ratingAt : v.commentAt)
          : (v.ratingAt || v.commentAt || ""),
        content: v.content,
        id: v.commentId || `rating-${user_id}`,
        updated_at: v.commentUpdatedAt || null,
      }));
      merged.sort((a, b) => (b.created_at as string).localeCompare(a.created_at as string));
      const total = merged.length;
      const paged = merged.slice(skip, skip + limit);
      const userIds = [...new Set(paged.map((x) => x.user_id))];
      let usersMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const users = await db.find("users", { id: { $in: userIds } });
        usersMap = users.reduce((acc: Record<string, any>, u: any) => {
          acc[u.id] = {
            id: u.id,
            full_name: u.full_name || u.first_name || "Anonymous",
            avatar_url: u.avatar_url || null,
            role: u.role,
          };
          return acc;
        }, {});
      }
      const reviews = paged.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        app_id,
        content: row.content,
        rating: row.rating,
        created_at: row.created_at,
        updated_at: (row as any).updated_at || null,
        user: usersMap[row.user_id] || { id: row.user_id, full_name: "Anonymous", avatar_url: null },
      }));
      return NextResponse.json({
        success: true,
        data: { comments: reviews, total, page, limit },
      });
    }

    const comments = await db.find("comments", { app_id }, {
      sort: { created_at: -1 },
      limit,
      skip,
    });

    const total = await db.count("comments", { app_id });

    const userIds = [...new Set(comments.map((c: any) => c.user_id))];
    let usersMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const users = await db.find("users", { id: { $in: userIds } });
      usersMap = users.reduce((acc: Record<string, any>, u: any) => {
        acc[u.id] = {
          id: u.id,
          full_name: u.full_name || u.first_name || "Anonymous",
          avatar_url: u.avatar_url || null,
          role: u.role,
        };
        return acc;
      }, {});
    }

    const commentsWithUsers = comments.map((c: any) => ({
      ...c,
      user: usersMap[c.user_id] || { id: c.user_id, full_name: "Anonymous", avatar_url: null },
    }));

    return NextResponse.json({
      success: true,
      data: { comments: commentsWithUsers, total, page, limit },
    });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/comments - Create a comment
export async function POST(request: Request) {
  try {
    const guard = featureGuard("comments");
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
    const { app_id, content } = body;

    if (!app_id) {
      return NextResponse.json({ error: "app_id is required" }, { status: 400 });
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: "Comment must be under 2000 characters" }, { status: 400 });
    }

    // Sanitize content
    const { validation } = await import("@/lib/rate-limit");
    const sanitizedContent = validation.sanitizeString(content, 2000);

    if (!sanitizedContent || sanitizedContent.trim().length === 0) {
      return NextResponse.json({ error: "Comment cannot be empty after sanitization" }, { status: 400 });
    }

    // Verify the project exists
    const app = await db.findOne("apps", { id: app_id });
    if (!app) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const result = await db.insertOne("comments", {
      user_id: user.id,
      app_id,
      content: sanitizedContent.trim(),
    });

    await db.updateOne("apps", { id: app_id }, { $inc: { comments_count: 1 } });

    // Fetch the user info for the response
    const userInfo = await db.findOne("users", { id: user.id });

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId,
        user_id: user.id,
        app_id,
        content: sanitizedContent.trim(),
        created_at: new Date().toISOString(),
        user: {
          id: user.id,
          full_name: userInfo?.full_name || userInfo?.first_name || "Anonymous",
          avatar_url: userInfo?.avatar_url || null,
          role: userInfo?.role,
        },
      },
    });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

// PUT /api/comments - Edit a comment (author only, within 24 hours)
export async function PUT(request: Request) {
  try {
    const guard = featureGuard("comments");
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
    const commentId = searchParams.get("id");
    if (!commentId) {
      return NextResponse.json({ error: "Comment id is required" }, { status: 400 });
    }

    const comment = await db.findOne("comments", { id: commentId });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json({ error: "Only the author can edit this comment" }, { status: 403 });
    }

    const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
    if (Date.now() - new Date(comment.created_at).getTime() > EDIT_WINDOW_MS) {
      return NextResponse.json({ error: "Editing window has expired (24 hours)" }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: "Comment must be under 2000 characters" }, { status: 400 });
    }

    const { validation } = await import("@/lib/rate-limit");
    const sanitizedContent = validation.sanitizeString(content, 2000);

    if (!sanitizedContent || sanitizedContent.trim().length === 0) {
      return NextResponse.json({ error: "Comment cannot be empty after sanitization" }, { status: 400 });
    }

    await db.updateOne("comments", { id: commentId }, {
      $set: { content: sanitizedContent.trim(), updated_at: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: commentId,
        content: sanitizedContent.trim(),
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error updating comment:", error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

// DELETE /api/comments - Delete a comment
export async function DELETE(request: Request) {
  try {
    const guard = featureGuard("comments");
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
    const commentId = searchParams.get("id");
    if (!commentId) {
      return NextResponse.json({ error: "Comment id is required" }, { status: 400 });
    }

    // Fetch the comment
    const comment = await db.findOne("comments", { id: commentId });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check permissions: comment author, project owner, or admin
    const isAuthor = comment.user_id === user.id;
    let isOwner = false;
    let isAdminUser = false;

    if (!isAuthor) {
      const app = await db.findOne("apps", { id: comment.app_id });
      isOwner = app?.submitted_by === user.id;
    }
    if (!isAuthor && !isOwner) {
      const currentUser = await db.findOne("users", { id: user.id });
      isAdminUser = currentUser?.role === "admin" || currentUser?.is_admin === true;
    }

    if (!isAuthor && !isOwner && !isAdminUser) {
      return NextResponse.json({ error: "Not authorized to delete this comment" }, { status: 403 });
    }

    await db.deleteOne("comments", { id: commentId });
    await db.updateOne("apps", { id: comment.app_id }, { $inc: { comments_count: -1 } });

    return NextResponse.json({ success: true, message: "Comment deleted" });
  } catch (error: any) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
