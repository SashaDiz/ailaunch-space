import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { checkIsAdmin } from "@/lib/supabase/auth";
import {
  DISPLAY_SETTINGS_KEY,
  normalizeDisplaySettings,
} from "@/lib/display-settings";

/** GET /api/admin/layout — Returns display settings (public, for the app to apply) */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", DISPLAY_SETTINGS_KEY)
      .maybeSingle();

    if (error) {
      console.error("[admin/layout] GET error:", error);
      return NextResponse.json(
        { error: "Failed to load layout settings" },
        { status: 500 }
      );
    }

    return NextResponse.json(normalizeDisplaySettings(data?.value));
  } catch (e) {
    console.error("[admin/layout] GET error:", e);
    return NextResponse.json(
      { error: "Failed to load layout settings" },
      { status: 500 }
    );
  }
}

/** PUT /api/admin/layout — Save display settings (admin only) */
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
    // Normalize coerces/validates the shape and drops anything unexpected.
    const value = normalizeDisplaySettings(body);

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        {
          key: DISPLAY_SETTINGS_KEY,
          value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

    if (error) {
      console.error("[admin/layout] PUT error:", error);
      return NextResponse.json(
        { error: "Failed to save layout settings" },
        { status: 500 }
      );
    }

    return NextResponse.json(value);
  } catch (e) {
    console.error("[admin/layout] PUT error:", e);
    return NextResponse.json(
      { error: "Failed to save layout settings" },
      { status: 500 }
    );
  }
}
