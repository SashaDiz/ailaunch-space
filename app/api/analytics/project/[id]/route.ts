import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/database";
import { getServerSession, isAdmin } from "@/lib/supabase/auth-helpers";
import { featureGuard } from "@/lib/features";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rate-limit";

// GET /api/analytics/project/[id] - Get analytics for a specific project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Feature guard
  const guard = featureGuard("analytics");
  if (guard) return guard;

  // Rate limiting
  const rateLimitResult = await checkRateLimit(request, "general");
  if (!rateLimitResult.allowed) {
    const rl = createRateLimitResponse(rateLimitResult);
    return NextResponse.json(JSON.parse(rl.body), {
      status: rl.status,
      headers: rl.headers,
    });
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    // Auth check: only the project owner or admins
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Fetch the project to verify ownership
    const project = await db.findOne("apps", { id });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    const userIsAdmin = await isAdmin();
    const isOwner = project.submitted_by === session.user.id;

    if (!isOwner && !userIsAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to view this project's analytics" },
        { status: 403 },
      );
    }

    // Fetch analytics records for this project
    const analytics = await db.find(
      "analytics",
      { target_type: "app", target_id: id },
      { sort: { date: -1 }, limit: 90 },
    );

    // Strip internal visitor hashes from the response
    const sanitized = analytics.map((record: any) => {
      const { referrers, ...rest } = record;
      return {
        ...rest,
        referrers: referrers?.sources || {},
      };
    });

    return NextResponse.json({
      success: true,
      data: sanitized,
    });
  } catch (error) {
    console.error("[analytics/project] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project analytics" },
      { status: 500 },
    );
  }
}
