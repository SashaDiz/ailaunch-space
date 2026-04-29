import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { checkIsAdmin } from '@/lib/supabase/auth';
import { db } from '@/lib/supabase/database';
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

// POST /api/admin/categories/reorder — bulk reorder spheres and categories
export async function POST(request: Request) {
  const demo = demoWriteResponse();
  if (demo) return demo;

  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const body = await request.json();
    const { order } = body;

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: "order must be an array" }, { status: 400 });
    }

    for (let i = 0; i < order.length; i++) {
      const { sphere, categoryIds } = order[i];
      if (!sphere || !Array.isArray(categoryIds)) continue;

      for (let j = 0; j < categoryIds.length; j++) {
        await db.updateOne("categories", { id: categoryIds[j] }, {
          $set: { sort_order: i * 1000 + j, sphere },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reorder error:", error);
    return NextResponse.json({ error: error.message || "Failed to reorder" }, { status: 500 });
  }
}
