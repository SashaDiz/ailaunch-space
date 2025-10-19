import { NextResponse } from "next/server";
import { db } from "../../../../libs/database.js";

// POST /api/projects/[slug]/click - Track click on external project link
export async function POST(request, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter is required", code: "MISSING_SLUG" },
        { status: 400 }
      );
    }

    // Find project by slug first, then by ID if slug doesn't work
    let project = await db.findOne("apps", { slug });
    
    // If not found by slug, try by ID (for backward compatibility)
    if (!project) {
      project = await db.findOne("apps", { id: slug });
    }

    if (!project) {
      return NextResponse.json(
        { error: "Project not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check if the project has a website URL
    if (!project.website_url) {
      return NextResponse.json(
        { error: "No website URL to track", code: "NO_WEBSITE_URL" },
        { status: 400 }
      );
    }

    // Increment click count and total engagement
    await db.updateOne(
      "apps",
      { id: project.id },
      {
        $inc: { 
          clicks: 1,
          total_engagement: 1 
        },
        $set: { updated_at: new Date() },
      }
    );

    // Get updated project to return current counts
    const updatedProject = await db.findOne("apps", { id: project.id });

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: updatedProject.id,
          slug: updatedProject.slug,
          clicks: updatedProject.clicks,
          total_engagement: updatedProject.total_engagement,
          website_url: updatedProject.website_url,
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

// GET /api/projects/[slug]/click - Get click statistics (optional)
export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter is required", code: "MISSING_SLUG" },
        { status: 400 }
      );
    }

    // Find project by slug first, then by ID if slug doesn't work
    let project = await db.findOne("apps", { slug });
    
    // If not found by slug, try by ID (for backward compatibility)
    if (!project) {
      project = await db.findOne("apps", { id: slug });
    }

    if (!project) {
      return NextResponse.json(
        { error: "Project not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: project.id,
          slug: project.slug,
          clicks: project.clicks || 0,
          views: project.views || 0,
          upvotes: project.upvotes || 0,
          total_engagement: project.total_engagement || 0,
          website_url: project.website_url,
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
