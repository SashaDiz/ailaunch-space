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

// PUT /api/admin/categories/spheres — rename sphere
export async function PUT(request: Request) {
  const demo = demoWriteResponse();
  if (demo) return demo;

  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const body = await request.json();
    const { oldName, newName } = body;

    if (!oldName || !newName?.trim()) {
      return NextResponse.json({ error: "Both oldName and newName are required" }, { status: 400 });
    }

    const trimmedNew = newName.trim();

    // Check that oldName exists
    const existing = await db.find("categories", { sphere: oldName }, { limit: 1 });
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Sphere not found" }, { status: 404 });
    }

    // Check that newName doesn't conflict (unless it's the same, e.g. case change)
    if (oldName !== trimmedNew) {
      const conflict = await db.find("categories", { sphere: trimmedNew }, { limit: 1 });
      if (conflict && conflict.length > 0) {
        return NextResponse.json({ error: "A sphere with this name already exists" }, { status: 409 });
      }
    }

    // Bulk update all categories with oldName to newName
    await db.updateMany("categories", { sphere: oldName }, { $set: { sphere: trimmedNew } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sphere rename error:", error);
    return NextResponse.json({ error: error.message || "Failed to rename sphere" }, { status: 500 });
  }
}

// POST /api/admin/categories/spheres — reorder spheres
export async function POST(request: Request) {
  const demo = demoWriteResponse();
  if (demo) return demo;

  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const body = await request.json();
    const { sphereOrder } = body;

    if (!Array.isArray(sphereOrder)) {
      return NextResponse.json({ error: "sphereOrder must be an array" }, { status: 400 });
    }

    // For each sphere, update sort_order of its categories
    // Sphere at index 0 gets base sort_order 0, index 1 gets 100, etc.
    for (let i = 0; i < sphereOrder.length; i++) {
      const sphere = sphereOrder[i];
      const baseOrder = i * 100;

      // Get categories in this sphere, sorted by current sort_order
      const cats = await db.find("categories", { sphere }, { sort: { sort_order: 1, name: 1 }, limit: 1000 });

      for (let j = 0; j < cats.length; j++) {
        await db.updateOne("categories", { id: cats[j].id }, { $set: { sort_order: baseOrder + j } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sphere reorder error:", error);
    return NextResponse.json({ error: error.message || "Failed to reorder spheres" }, { status: 500 });
  }
}

// DELETE /api/admin/categories/spheres — delete empty sphere
export async function DELETE(request: Request) {
  const demo = demoWriteResponse();
  if (demo) return demo;

  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json({ error: "Sphere name is required" }, { status: 400 });
    }

    // Check no categories use this sphere
    const cats = await db.find("categories", { sphere: name }, { limit: 1 });
    if (cats && cats.length > 0) {
      return NextResponse.json({ error: "Cannot delete sphere with categories assigned to it" }, { status: 409 });
    }

    // Spheres are derived values — if no categories have this sphere, it's already gone
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sphere delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete sphere" }, { status: 500 });
  }
}
