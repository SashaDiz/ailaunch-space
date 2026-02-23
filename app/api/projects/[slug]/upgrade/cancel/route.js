import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "../../../../../libs/database.js";

// POST /api/projects/[slug]/upgrade/cancel - Restore original schedule after payment cancellation
export async function POST(request, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Project slug is required", code: "MISSING_SLUG" },
        { status: 400 }
      );
    }

    // Authenticate user via Supabase
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        {
          error: "Authentication required.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    // Find project
    let existingProject =
      (await db.findOne("apps", {
        slug,
        submitted_by: user.id,
      })) ||
      (await db.findOne("apps", {
        id: slug,
        submitted_by: user.id,
      }));

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Only restore if this is an upgrade that was cancelled (has pending fields)
    if (!existingProject.pending_launch_week || !existingProject.original_launch_week) {
      return NextResponse.json({
        success: true,
        message: "No pending upgrade to cancel",
      });
    }

    // Restore original launch schedule
    await db.updateOne(
      "apps",
      { id: existingProject.id },
      {
        $set: {
          // Restore original schedule
          launch_week: existingProject.original_launch_week,
          launch_date: existingProject.original_launch_date,
          weekly_competition_id: existingProject.original_weekly_competition_id,
          launch_month: existingProject.original_launch_month,
          // Restore standard plan
          plan: "standard",
          // Clear pending and original fields
        },
        $unset: {
          pending_launch_week: "",
          pending_launch_date: "",
          pending_weekly_competition_id: "",
          pending_launch_month: "",
          original_launch_week: "",
          original_launch_date: "",
          original_weekly_competition_id: "",
          original_launch_month: "",
          premium_badge: "",
          skip_queue: "",
          social_promotion: "",
          guaranteed_backlinks: "",
          homepage_duration: "",
          plan_price: "",
          is_draft: "",
          payment_status: "",
          payment_initiated_at: "",
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Original schedule restored",
    });
  } catch (error) {
    console.error("Cancel upgrade error:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel upgrade",
        code: "INTERNAL_ERROR",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
