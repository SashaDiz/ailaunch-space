import { NextResponse } from "next/server";
import { db } from "../../../../libs/database.js";

// POST /api/directories/[slug]/click - Track click on external project link
export async function POST(request, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter is required", code: "MISSING_SLUG" },
        { status: 400 }
      );
    }

    // Find directory by slug first, then by ID if slug doesn't work
    let directory = await db.findOne("apps", { slug });
    
    // If not found by slug, try by ID (for backward compatibility)
    if (!directory) {
      directory = await db.findOne("apps", { id: slug });
    }

    if (!directory) {
      return NextResponse.json(
        { error: "Directory not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check if the directory has a website URL
    if (!directory.website_url) {
      return NextResponse.json(
        { error: "No website URL to track", code: "NO_WEBSITE_URL" },
        { status: 400 }
      );
    }

    // Increment click count and total engagement
    await db.updateOne(
      "apps",
      { id: directory.id },
      {
        $inc: { 
          clicks: 1,
          total_engagement: 1 
        },
        $set: { updated_at: new Date() },
      }
    );

    // Get updated directory to return current counts
    const updatedDirectory = await db.findOne("apps", { id: directory.id });

    return NextResponse.json({
      success: true,
      data: {
        directory: {
          id: updatedDirectory.id,
          slug: updatedDirectory.slug,
          clicks: updatedDirectory.clicks,
          total_engagement: updatedDirectory.total_engagement,
          website_url: updatedDirectory.website_url,
        },
        message: "Click tracked successfully",
      },
    });

  } catch (error) {
    console.error("Click tracking API error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// GET /api/directories/[slug]/click - Get click statistics (optional)
export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter is required", code: "MISSING_SLUG" },
        { status: 400 }
      );
    }

    // Find directory by slug first, then by ID if slug doesn't work
    let directory = await db.findOne("apps", { slug });
    
    // If not found by slug, try by ID (for backward compatibility)
    if (!directory) {
      directory = await db.findOne("apps", { id: slug });
    }

    if (!directory) {
      return NextResponse.json(
        { error: "Directory not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        directory: {
          id: directory.id,
          slug: directory.slug,
          clicks: directory.clicks || 0,
          views: directory.views || 0,
          upvotes: directory.upvotes || 0,
          total_engagement: directory.total_engagement || 0,
          website_url: directory.website_url,
        },
      },
    });

  } catch (error) {
    console.error("Click stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
