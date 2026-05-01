import { NextResponse } from "next/server";
import { getSession } from '@/lib/supabase/auth';
import { isAdmin } from '@/lib/supabase/auth-helpers';
import { db } from '@/lib/supabase/database';

async function checkAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return false;
  return await isAdmin();
}

// GET /api/admin/promotions - List all promotions
export async function GET(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const filter: Record<string, any> = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const promotions = await db.find("promotions", filter, {
      sort: { position: 1, created_at: -1 },
      limit: 100,
    });

    return NextResponse.json({ success: true, data: promotions });
  } catch (error: any) {
    console.error("Admin promotions GET error:", error);
    return NextResponse.json({ error: "Failed to fetch promotions" }, { status: 500 });
  }
}

// PUT /api/admin/promotions - Update promotion
export async function PUT(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Promotion ID is required" }, { status: 400 });
    }

    const allowedFields = [
      'status', 'name', 'short_description', 'logo_url', 'website_url',
      'cta_text', 'placement_banner', 'placement_catalog', 'placement_detail_page',
      'position', 'admin_notes',
    ];
    const safeUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        safeUpdates[key] = updates[key];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await db.updateOne("promotions", { id }, { $set: safeUpdates });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin promotions PUT error:", error);
    return NextResponse.json({ error: "Failed to update promotion" }, { status: 500 });
  }
}

// POST /api/admin/promotions - Create promotion directly (bypasses Stripe)
export async function POST(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const session = await getSession();
    const body = await request.json();

    const { name, short_description, logo_url, website_url, cta_text,
            placement_banner, placement_catalog, placement_detail_page } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!short_description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (!logo_url?.trim()) {
      return NextResponse.json({ error: "Logo URL is required" }, { status: 400 });
    }
    if (!website_url?.trim()) {
      return NextResponse.json({ error: "Website URL is required" }, { status: 400 });
    }
    if (!placement_banner && !placement_catalog && !placement_detail_page) {
      return NextResponse.json({ error: "At least one placement is required" }, { status: 400 });
    }

    const result = await db.insertOne("promotions", {
      user_id: session.user.id,
      name: name.trim(),
      short_description: short_description.trim(),
      logo_url: logo_url.trim(),
      website_url: website_url.trim(),
      cta_text: cta_text?.trim() || null,
      placement_banner: !!placement_banner,
      placement_catalog: !!placement_catalog,
      placement_detail_page: !!placement_detail_page,
      monthly_price: 0,
      status: "active",
    });

    return NextResponse.json({ success: true, data: { id: result.insertedId } });
  } catch (error: any) {
    console.error("Admin promotions POST error:", error);
    return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 });
  }
}

// DELETE /api/admin/promotions - Delete promotion
export async function DELETE(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Promotion ID is required" }, { status: 400 });
    }

    await db.deleteOne("promotions", { id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin promotions DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete promotion" }, { status: 500 });
  }
}
