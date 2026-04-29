import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { featureGuard } from '@/lib/features';

const MAX_AVATARS = 7;

/**
 * GET /api/social-proof
 * Returns total user count and users with avatar_url for the social proof block.
 * Uses admin-selected userIds from site_settings when available; otherwise falls back
 * to users with avatars ordered by updated_at.
 */
export async function GET() {
  const guard = featureGuard('socialProof');
  if (guard) return guard;

  try {
    const supabase = getSupabaseAdmin();

    const [{ count: total }, settingsRes] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("site_settings").select("value").eq("key", "social_proof_avatars").maybeSingle(),
    ]);

    const value = settingsRes.data?.value as { userIds?: string[] } | null;
    const selectedIds = Array.isArray(value?.userIds) ? value.userIds : [];

    let withValidAvatar: { id: string; avatar_url: string }[] = [];

    if (selectedIds.length > 0) {
      const { data: selectedUsers } = await supabase
        .from("users")
        .select("id, avatar_url")
        .in("id", selectedIds);

      type UserRow = { id: string; avatar_url: string | null };
      const byId = new Map<string, UserRow>((selectedUsers || []).map((u: UserRow) => [u.id, u]));
      withValidAvatar = selectedIds
        .map((id) => byId.get(id))
        .filter((u): u is { id: string; avatar_url: string } =>
          !!u && !!u.avatar_url && String(u.avatar_url).trim() !== ""
        )
        .slice(0, MAX_AVATARS)
        .map(({ id, avatar_url }) => ({ id, avatar_url }));
    }

    return NextResponse.json({
      success: true,
      data: {
        total: total ?? 0,
        users: withValidAvatar,
      },
    });
  } catch (error) {
    console.error("Social proof API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch social proof" },
      { status: 500 }
    );
  }
}
