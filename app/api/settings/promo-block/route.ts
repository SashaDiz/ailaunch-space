import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { checkIsAdmin } from "@/lib/supabase/auth";
import { DEFAULT_PROMO_BLOCK_CONFIG } from "@/config/promo-block.config";
import type { PromoBlockConfig } from "@/types/config";

const SETTINGS_KEY = "promo_block";

/** GET /api/settings/promo-block — Public, returns banner config */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    if (error) {
      console.error("[settings/promoblock-banner] GET error:", error);
      return NextResponse.json(DEFAULT_PROMO_BLOCK_CONFIG);
    }

    const value = data?.value as Partial<PromoBlockConfig> | null;
    return NextResponse.json(
      value ? { ...DEFAULT_PROMO_BLOCK_CONFIG, ...value } : DEFAULT_PROMO_BLOCK_CONFIG
    );
  } catch (e) {
    console.error("[settings/promoblock-banner] GET error:", e);
    return NextResponse.json(DEFAULT_PROMO_BLOCK_CONFIG);
  }
}

/** PUT /api/settings/promo-block — Admin only, save banner config */
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      getSupabaseUrl()!,
      getSupabasePublishableKey()!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const isAdmin = await checkIsAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const value: Partial<PromoBlockConfig> = {};
    if (typeof body.enabled === "boolean") value.enabled = body.enabled;
    if (typeof body.title === "string") value.title = body.title.trim();
    if (typeof body.imageUrl === "string")
      value.imageUrl = body.imageUrl.trim();
    if (typeof body.description === "string")
      value.description = body.description.trim();
    if (Array.isArray(body.benefits)) {
      value.benefits = body.benefits
        .filter((b: unknown) => typeof b === "string" && (b as string).trim())
        .map((b: string) => b.trim());
    }
    if (typeof body.ctaText === "string") value.ctaText = body.ctaText.trim();
    if (typeof body.ctaUrl === "string")
      value.ctaUrl = body.ctaUrl.trim();
    if (typeof body.price === "string") value.price = body.price.trim();
    if (typeof body.learnMoreUrl === "string")
      value.learnMoreUrl = body.learnMoreUrl.trim();
    if (typeof body.learnMoreText === "string")
      value.learnMoreText = body.learnMoreText.trim();
    if (typeof body.dismissText === "string")
      value.dismissText = body.dismissText.trim();
    if (typeof body.triggerButtonText === "string")
      value.triggerButtonText = body.triggerButtonText.trim();
    if (typeof body.triggerButtonIcon === "string")
      value.triggerButtonIcon = body.triggerButtonIcon.trim();
    if (typeof body.ctaButtonIcon === "string")
      value.ctaButtonIcon = body.ctaButtonIcon.trim();
    if (typeof body.dashboardCtaText === "string")
      value.dashboardCtaText = body.dashboardCtaText.trim();
    if (typeof body.projectDetailHeading === "string")
      value.projectDetailHeading = body.projectDetailHeading.trim();
    if (typeof body.projectDetailDescription === "string")
      value.projectDetailDescription = body.projectDetailDescription.trim();
    if (typeof body.projectDetailCtaText === "string")
      value.projectDetailCtaText = body.projectDetailCtaText.trim();
    if (typeof body.projectDetailDismissText === "string")
      value.projectDetailDismissText = body.projectDetailDismissText.trim();

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        { key: SETTINGS_KEY, value, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) {
      console.error("[settings/promoblock-banner] PUT error:", error);
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ...DEFAULT_PROMO_BLOCK_CONFIG, ...value });
  } catch (e) {
    console.error("[settings/promoblock-banner] PUT error:", e);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
