import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { checkIsAdmin } from "@/lib/supabase/auth";

const SETTINGS_KEY = "social_proof_avatars";

type SocialProofAvatarsValue = { userIds: string[] };

async function checkAdminAuth(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    getSupabaseUrl()!,
    getSupabasePublishableKey()!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

/** GET — Returns selected userIds and list of users with avatars for selection */
export async function GET(request: Request) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const supabase = getSupabaseAdmin();

    const [settingsRes, usersRes] = await Promise.all([
      supabase.from("site_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle(),
      supabase
        .from("users")
        .select("id, avatar_url, full_name, first_name, last_name")
        .not("avatar_url", "is", null)
        .neq("avatar_url", "")
        .order("full_name", { ascending: true, nullsFirst: false }),
    ]);

    const value = settingsRes.data?.value as SocialProofAvatarsValue | null;
    const selectedUserIds = Array.isArray(value?.userIds) ? value.userIds : [];

    const usersWithAvatars = (usersRes.data || []).map((u) => ({
      id: u.id,
      avatar_url: u.avatar_url,
      name: u.full_name || u.first_name || u.last_name || "—",
    }));

    return NextResponse.json({
      success: true,
      data: {
        selectedUserIds,
        usersWithAvatars,
      },
    });
  } catch (error) {
    console.error("[admin/social-proof-avatars] GET error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

/** PUT — Save selected user IDs for social proof avatars */
export async function PUT(request: Request) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const body = await request.json();
    const userIds = Array.isArray(body.userIds)
      ? body.userIds.filter((id: unknown) => typeof id === "string")
      : [];

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        { key: SETTINGS_KEY, value: { userIds }, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) {
      console.error("[admin/social-proof-avatars] PUT error:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { userIds } });
  } catch (error) {
    console.error("[admin/social-proof-avatars] PUT error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
