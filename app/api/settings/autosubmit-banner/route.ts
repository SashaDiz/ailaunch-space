import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { checkIsAdmin } from "@/lib/supabase/auth";
import { DEFAULT_AUTOSUBMIT_CONFIG } from "@/config/autosubmit.config";
import type { AutoSubmitBannerConfig } from "@/types/config";

const SETTINGS_KEY = "autosubmit_banner";

/** GET /api/settings/autosubmit-banner — Public, returns banner config */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    if (error) {
      console.error("[settings/autosubmit-banner] GET error:", error);
      return NextResponse.json(DEFAULT_AUTOSUBMIT_CONFIG);
    }

    const value = data?.value as Partial<AutoSubmitBannerConfig> | null;
    return NextResponse.json(
      value ? { ...DEFAULT_AUTOSUBMIT_CONFIG, ...value } : DEFAULT_AUTOSUBMIT_CONFIG
    );
  } catch (e) {
    console.error("[settings/autosubmit-banner] GET error:", e);
    return NextResponse.json(DEFAULT_AUTOSUBMIT_CONFIG);
  }
}

/** PUT /api/settings/autosubmit-banner — Admin only, save banner config */
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

    const value: Partial<AutoSubmitBannerConfig> = {};
    if (typeof body.enabled === "boolean") value.enabled = body.enabled;
    if (typeof body.title === "string") value.title = body.title.trim();
    if (typeof body.description === "string")
      value.description = body.description.trim();
    if (Array.isArray(body.benefits)) {
      value.benefits = body.benefits
        .filter((b: unknown) => typeof b === "string" && (b as string).trim())
        .map((b: string) => b.trim());
    }
    if (typeof body.ctaText === "string") value.ctaText = body.ctaText.trim();
    if (typeof body.checkoutUrl === "string")
      value.checkoutUrl = body.checkoutUrl.trim();
    if (typeof body.price === "string") value.price = body.price.trim();
    if (typeof body.learnMoreUrl === "string")
      value.learnMoreUrl = body.learnMoreUrl.trim();
    if (typeof body.learnMoreText === "string")
      value.learnMoreText = body.learnMoreText.trim();
    if (typeof body.dismissText === "string")
      value.dismissText = body.dismissText.trim();
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
      console.error("[settings/autosubmit-banner] PUT error:", error);
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ...DEFAULT_AUTOSUBMIT_CONFIG, ...value });
  } catch (e) {
    console.error("[settings/autosubmit-banner] PUT error:", e);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
