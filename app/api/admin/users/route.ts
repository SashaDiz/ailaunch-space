import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { checkIsAdmin } from '@/lib/supabase/auth';
import { db } from '@/lib/supabase/database';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { demoAdminAuth, demoWriteResponse } from '@/lib/demo';

async function checkAdminAuth(request: Request) {
  const demo = demoAdminAuth();
  if (demo) return demo;

  const authHeader = request.headers.get('authorization');
  const hasCronSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (hasCronSecret) return { session: { user: { id: 'cron' } } };

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

  return { session: { user } };
}

// GET /api/admin/users — list users with search, pagination, role filter
export async function GET(request: Request) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "all";

    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        { full_name: { $regex: search } },
        { first_name: { $regex: search } },
        { last_name: { $regex: search } },
      ];
    }

    if (role === "admin") filter.is_admin = true;
    else if (role === "moderator") filter.role = "moderator";
    else if (role === "banned") filter.is_banned = true;
    else if (role === "user") {
      filter.is_admin = { $ne: true };
      filter.role = { $ne: "moderator" };
    }

    const [users, totalCount, settingsRes] = await Promise.all([
      db.find("users", filter, {
        sort: { created_at: -1 },
        skip: (page - 1) * limit,
        limit,
      }),
      db.count("users", filter),
      getSupabaseAdmin().from("site_settings").select("value").eq("key", "social_proof_avatars").maybeSingle(),
    ]);

    const value = settingsRes.data?.value as { userIds?: string[] } | null;
    const socialProofSelectedUserIds = Array.isArray(value?.userIds) ? value.userIds : [];

    return NextResponse.json({
      success: true,
      data: {
        users,
        socialProofSelectedUserIds,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// PUT /api/admin/users — update user role/ban status
export async function PUT(request: Request) {
  const demo = demoWriteResponse();
  if (demo) return demo;

  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.role !== undefined) {
      updateData.role = body.role;
      updateData.is_admin = body.role === "admin";
    }
    if (body.is_banned !== undefined) {
      updateData.is_banned = body.is_banned;
      if (!body.is_banned) updateData.banned_until = null;
    }
    if (body.banned_until !== undefined) updateData.banned_until = body.banned_until;

    const result = await db.updateOne("users", { id }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User updated" });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
