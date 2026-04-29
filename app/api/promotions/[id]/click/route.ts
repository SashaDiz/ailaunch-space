import { NextResponse } from "next/server";
import { db } from '@/lib/supabase/database';

// POST /api/promotions/[id]/click - Track promotion click
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Promotion ID is required" }, { status: 400 });
    }

    await db.updateOne("promotions", { id }, { $inc: { clicks: 1 } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Promotion click tracking error:", error.message);
    return NextResponse.json({ success: true }); // Don't fail the click
  }
}
