import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { db } from "@/lib/supabase/database";
import {
  createStripeCheckoutSession,
  isStripeConfigured,
} from "@/lib/payments/polar";

// POST /api/projects/[slug]/upgrade — upgrade a free listing to premium
export async function POST(request, { params }) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error: "Payment provider is not configured. Please contact support or try again later.",
          code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
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
      getSupabaseUrl(),
      getSupabasePublishableKey(),
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

    // Verify project ownership (try slug first, then id for safety)
    const existingProject =
      (await db.findOne("apps", { slug, submitted_by: user.id })) ||
      (await db.findOne("apps", { id: slug, submitted_by: user.id }));

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Disallow upgrades for already-premium / paid projects
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

    // Mark project as upgrade pending. Premium perks (badge, dofollow link)
    // are applied by the webhook after the order is paid — never here.
    await db.updateOne(
      "apps",
      { id: existingProject.id },
      {
        $set: {
          upgrade_pending: true,
          payment_initiated_at: new Date(),
          updated_at: new Date(),
        },
      }
    );

    // Build success / cancel URLs
    const baseUrl =
      process.env.NEXT_PUBLIC_URL ||
      `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("host")}`;

    const successUrl = `${baseUrl}/dashboard?payment=success&projectId=${existingProject.id}`;
    const cancelUrl = `${baseUrl}/dashboard?payment=cancelled&projectId=${existingProject.id}`;

    const checkout = await createStripeCheckoutSession({
      planType: "premium",
      customerEmail: user.email,
      projectId: existingProject.id,
      projectData: {
        name: existingProject.name,
        slug: existingProject.slug,
        description: existingProject.short_description,
        website_url: existingProject.website_url,
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
