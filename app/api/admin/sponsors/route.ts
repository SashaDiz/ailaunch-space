import { NextResponse } from "next/server";
import { getSession } from '@/lib/supabase/auth';
import { isAdmin } from '@/lib/supabase/auth-helpers';
import { db } from '@/lib/supabase/database';

async function checkAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return false;
  return await isAdmin();
}

// GET /api/admin/sponsors - List all sponsors
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

    const sponsors = await db.find("partners", filter, {
      sort: { position: 1, created_at: -1 },
      limit: 100,
    });

    return NextResponse.json({ success: true, data: sponsors });
  } catch (error: any) {
    console.error("Admin sponsors GET error:", error);
    return NextResponse.json({ error: "Failed to fetch sponsors" }, { status: 500 });
  }
}

// PUT /api/admin/sponsors - Update sponsor
export async function PUT(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Sponsor ID is required" }, { status: 400 });
    }

    // Only allow updating specific fields
    const allowedFields = ['status', 'name', 'description', 'logo', 'website_url', 'position', 'admin_notes'];
    const safeUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        safeUpdates[key] = updates[key];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await db.updateOne("partners", { id }, { $set: safeUpdates });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin sponsors PUT error:", error);
    return NextResponse.json({ error: "Failed to update sponsor" }, { status: 500 });
  }
}

// POST /api/admin/sponsors - Create sponsor directly (bypasses Stripe)
export async function POST(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const session = await getSession();
    const body = await request.json();

    const { name, description, logo, website_url } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (!logo?.trim()) {
      return NextResponse.json({ error: "Logo URL is required" }, { status: 400 });
    }
    if (!website_url?.trim()) {
      return NextResponse.json({ error: "Website URL is required" }, { status: 400 });
    }

    const result = await db.insertOne("partners", {
      user_id: session.user.id,
      name: name.trim(),
      description: description.trim(),
      logo: logo.trim(),
      website_url: website_url.trim(),
      status: "active",
      position: 0,
    });

    return NextResponse.json({ success: true, data: { id: result.insertedId } });
  } catch (error: any) {
    console.error("Admin sponsors POST error:", error);
    return NextResponse.json({ error: "Failed to create sponsor" }, { status: 500 });
  }
}

// DELETE /api/admin/sponsors - Delete sponsor
export async function DELETE(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Sponsor ID is required" }, { status: 400 });
    }

    await db.deleteOne("partners", { id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin sponsors DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete sponsor" }, { status: 500 });
  }
}
