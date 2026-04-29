import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/database";

// GET /api/categories/[slug] - Get single category by slug with app count
export async function GET(request, { params }) {
  try {
    const { checkRateLimit, createRateLimitResponse } = await import("@/lib/rate-limit");
    const rateLimitResult = await checkRateLimit(request, "general");
    if (!rateLimitResult.allowed) {
      const rateLimitResponse = createRateLimitResponse(rateLimitResult);
      return new NextResponse(rateLimitResponse.body, {
        status: rateLimitResponse.status,
        headers: rateLimitResponse.headers,
      });
    }

    const { slug } = await params;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const category = await db.findOne("categories", { slug });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Get live app count for this category
    const identifiers = [category.name, category.slug].filter(Boolean);
    const appCount = await db.count("apps", {
      status: "live",
      categories: { $overlaps: identifiers },
    });

    return NextResponse.json({
      success: true,
      data: { ...category, app_count: appCount },
    });
  } catch (error) {
    console.error("Category by slug API error:", error.message);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
