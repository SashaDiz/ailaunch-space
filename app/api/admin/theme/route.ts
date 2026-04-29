import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { checkIsAdmin } from "@/lib/supabase/auth";
import { demoWriteResponse } from "@/lib/demo";
import type { FullThemeConfig } from "@/config/themes.config";

const THEME_KEY = "theme";

export type SiteThemeValue = {
  activeThemeId: string;
  customTheme?: FullThemeConfig;
};

/** GET /api/admin/theme — Returns site theme (public, for layout to apply) */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", THEME_KEY)
      .maybeSingle();

    if (error) {
      console.error("[admin/theme] GET error:", error);
      return NextResponse.json(
        { error: "Failed to load theme" },
        { status: 500 }
      );
    }

    const value = (data?.value as SiteThemeValue) ?? null;
    return NextResponse.json({
      activeThemeId: value?.activeThemeId ?? "default",
      customTheme: value?.customTheme ?? undefined,
    });
  } catch (e) {
    console.error("[admin/theme] GET error:", e);
    return NextResponse.json(
      { error: "Failed to load theme" },
      { status: 500 }
    );
  }
}

/** PUT /api/admin/theme — Save site theme (admin only) */
export async function PUT(request: Request) {
  const demo = demoWriteResponse();
  if (demo) return demo;

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
    const activeThemeId =
      typeof body.activeThemeId === "string" ? body.activeThemeId : "default";
    const customTheme =
      body.customTheme &&
      typeof body.customTheme === "object" &&
      typeof body.customTheme.light === "object" &&
      typeof body.customTheme.dark === "object"
        ? (body.customTheme as FullThemeConfig)
        : undefined;

    const value: SiteThemeValue = { activeThemeId };
    if (customTheme) value.customTheme = customTheme;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        { key: THEME_KEY, value, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) {
      console.error("[admin/theme] PUT error:", error);
      return NextResponse.json(
        { error: "Failed to save theme" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      activeThemeId,
      customTheme: customTheme ?? undefined,
    });
  } catch (e) {
    console.error("[admin/theme] PUT error:", e);
    return NextResponse.json(
      { error: "Failed to save theme" },
      { status: 500 }
    );
  }
}
