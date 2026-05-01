import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { checkIsAdmin } from '@/lib/supabase/auth';
import { db } from '@/lib/supabase/database';

async function checkAdminAuth(request: Request) {
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

// GET /api/admin/categories — list all categories
export async function GET(request: Request) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const categories = await db.find("categories", {}, {
      sort: { sort_order: 1, name: 1 },
      limit: 1000,
    });

    // Get unique spheres
    const spheres = [...new Set(categories.map((c: any) => c.sphere).filter(Boolean))].sort();

    return NextResponse.json({ success: true, data: { categories, spheres } });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

// POST /api/admin/categories — create category
export async function POST(request: Request) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const body = await request.json();
    const { name, sphere, description, color, icon, sort_order } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = (body.slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check duplicate
    const existing = await db.findOne("categories", { $or: [{ slug }, { name: name.trim() }] });
    if (existing) {
      return NextResponse.json({ error: "Category with this name or slug already exists" }, { status: 409 });
    }

    const result = await db.insertOne("categories", {
      name: name.trim(),
      slug,
      sphere: sphere || '',
      description: description || '',
      color: color || '#6366f1',
      icon: icon || '',
      css_class: `category-${slug}`,
      sort_order: sort_order ?? 999,
      app_count: 0,
      featured: false,
    });

    return NextResponse.json({ success: true, data: { id: result.insertedId, slug } });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

// PUT /api/admin/categories — update category
export async function PUT(request: Request) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Category ID required" }, { status: 400 });

    const body = await request.json();
    const allowedFields = ['name', 'slug', 'sphere', 'description', 'color', 'icon', 'sort_order', 'featured'];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    if (updateData.name && !updateData.slug) {
      updateData.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    const result = await db.updateOne("categories", { id }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Category updated" });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

// DELETE /api/admin/categories — delete category
export async function DELETE(request: Request) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Category ID required" }, { status: 400 });

    // Check if any projects use this category
    const category = await db.findOne("categories", { id });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const projectCount = await db.count("apps", {
      categories: { $in: [category.name, category.slug] },
    }).catch(() => 0);

    if (projectCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${projectCount} project(s) use this category. Reassign them first.` },
        { status: 409 }
      );
    }

    await db.deleteOne("categories", { id });
    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
