import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "../../../../libs/database.js";
import {
  createStripeCheckoutSession,
  isStripeConfigured,
} from "../../../../libs/stripe.js";

// POST /api/projects/[slug]/upgrade - Upgrade a standard launch to premium
export async function POST(request, { params }) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured. Please contact support or try again later.",
          code: "STRIPE_NOT_CONFIGURED",
        },
        { status: 500 }
      );
    }

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Project slug is required", code: "MISSING_SLUG" },
        { status: 400 }
      );
    }

    // Authenticate user via Supabase (same pattern as /api/projects)
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
          error: "Authentication required. Please sign in to upgrade.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { launch_week } = body || {};

    if (!launch_week) {
      return NextResponse.json(
        {
          error: "Launch week is required to upgrade to premium.",
          code: "MISSING_LAUNCH_WEEK",
        },
        { status: 400 }
      );
    }

    // Verify project ownership and plan (try slug first, then id for safety)
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

    // Disallow upgrades for already premium / paid projects
    if (
      existingProject.plan === "premium" ||
      existingProject.payment_status === true
    ) {
      return NextResponse.json(
        {
          error: "This project is already on a premium plan.",
          code: "ALREADY_PREMIUM",
        },
        { status: 400 }
      );
    }

    // Only allow upgrade before the launch/competition starts
    if (existingProject.weekly_competition_id) {
      const competition = await db.findOne("competitions", {
        id: existingProject.weekly_competition_id,
      });

      if (competition?.start_date) {
        const startDate = new Date(competition.start_date);
        if (new Date() >= startDate) {
          return NextResponse.json(
            {
              error:
                "This project has already entered its launch week and cannot be upgraded.",
              code: "UPGRADE_NOT_ALLOWED",
            },
            { status: 403 }
          );
        }
      }
    }

    // Look up selected weekly competition for the new premium launch week
    const selectedWeeklyCompetition = await db.findOne("competitions", {
      competition_id: launch_week,
      type: "weekly",
    });

    if (!selectedWeeklyCompetition) {
      return NextResponse.json(
        {
          error: "Selected launch week not found",
          code: "INVALID_WEEK",
        },
        { status: 400 }
      );
    }

    // Ensure the selected week is in the future
    const competitionStart = new Date(selectedWeeklyCompetition.start_date);
    if (new Date() >= competitionStart) {
      return NextResponse.json(
        {
          error:
            "Selected launch week has already started. Please choose a future week.",
          code: "WEEK_STARTED",
        },
        { status: 400 }
      );
    }

    // Check premium capacity (shared + extra slots)
    const totalUsed = selectedWeeklyCompetition.total_submissions || 0;
    if (totalUsed >= 25) {
      return NextResponse.json(
        {
          error:
            "Selected launch week is full for premium submissions. Please choose another week.",
          code: "WEEK_FULL",
        },
        { status: 400 }
      );
    }

    // Compute launch month and plan details (mirror /api/projects POST)
    const launchDate = new Date(selectedWeeklyCompetition.start_date);
    const launchYear = launchDate.getFullYear();
    const launchMonth = String(launchDate.getMonth() + 1).padStart(2, "0");
    const monthlyCompetitionId = `${launchYear}-${launchMonth}`;

    const planDetails = {
      price: 15,
      homepage_duration: 7,
      guaranteed_backlinks: 3,
      premium_badge: true,
      skip_queue: true,
      social_promotion: true,
    };

    // Store original launch info to restore if payment fails
    const originalLaunchInfo = {
      original_launch_week: existingProject.launch_week,
      original_launch_date: existingProject.launch_date,
      original_weekly_competition_id: existingProject.weekly_competition_id,
      original_launch_month: existingProject.launch_month,
    };

    // Store new premium launch info in pending fields (don't override original until payment succeeds)
    const pendingLaunchInfo = {
      pending_launch_week: launch_week,
      pending_launch_date: selectedWeeklyCompetition.start_date,
      pending_weekly_competition_id: selectedWeeklyCompetition.id,
      pending_launch_month: monthlyCompetitionId,
    };

    // Update project into premium draft awaiting payment
    // Keep original launch_week, launch_date, weekly_competition_id unchanged until payment succeeds
    await db.updateOne(
      "apps",
      { id: existingProject.id },
      {
        $set: {
          plan: "premium",
          plan_price: planDetails.price,
          premium_badge: planDetails.premium_badge,
          skip_queue: planDetails.skip_queue,
          social_promotion: planDetails.social_promotion,
          guaranteed_backlinks: planDetails.guaranteed_backlinks,
          homepage_duration: planDetails.homepage_duration,
          // Store pending launch info (will be applied after payment)
          ...pendingLaunchInfo,
          // Store original launch info (for restoration if payment fails)
          ...originalLaunchInfo,
          // Mark as draft until payment succeeds
          is_draft: true,
          payment_status: false,
          scheduled_launch: false,
          payment_initiated_at: new Date(),
          updated_at: new Date(),
        },
      }
    );

    const updatedProject = await db.findOne("apps", { id: existingProject.id });

    // Prepare Stripe checkout session
    const baseUrl =
      process.env.NEXT_PUBLIC_URL ||
      `${request.headers.get("x-forwarded-proto") || "http"}://${
        request.headers.get("host")
      }`;

    const successUrl = `${baseUrl}/dashboard?payment=success&projectId=${existingProject.id}`;
    const cancelUrl = `${baseUrl}/dashboard?payment=cancelled&projectId=${existingProject.id}`;

    const checkout = await createStripeCheckoutSession({
      planType: "premium",
      customerEmail: user.email,
      projectId: existingProject.id,
      projectData: {
        name: updatedProject?.name || existingProject.name,
        slug: updatedProject?.slug || existingProject.slug,
        description:
          updatedProject?.short_description || existingProject.short_description,
        website_url:
          updatedProject?.website_url || existingProject.website_url,
      },
      successUrl,
      cancelUrl,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        projectId: existingProject.id,
        checkoutUrl: checkout.url,
        checkoutId: checkout.sessionId,
      },
    });
  } catch (error) {
    console.error("Project upgrade error:", error);
    return NextResponse.json(
      {
        error: "Failed to upgrade project to premium",
        code: "INTERNAL_ERROR",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
