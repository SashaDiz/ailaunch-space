import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "../../../libs/database.js";

// GET /api/directories/[slug] - Get directory by slug or ID
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

    // Check authentication for access control
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Check access: owner can see drafts/pending, others only see live/approved
    const isOwner = user && directory.submitted_by === user.id;
    const isPublic = directory.status === "live" || directory.status === "approved";

    if (!isOwner && !isPublic) {
      return NextResponse.json(
        { error: "Directory not found or access denied", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Increment view count (only for public/non-owner views to avoid inflating counts during editing)
    if (!isOwner) {
      await db.updateOne(
        "apps",
        { id: directory.id },
        {
          $inc: { views: 1 },
          $set: { updated_at: new Date() },
        }
      );
    }

    // Get user's vote status if authenticated
    let userVoted = false;

    if (user?.id) {
      const vote = await db.findOne("votes", {
        user_id: user.id,
        app_id: directory.id,
      });
      userVoted = !!vote;
    }

    // Get related directories (same categories)
    // Use $overlaps for array-to-array comparison in Supabase
    const relatedDirectories = await db.find(
      "apps",
      {
        categories: { $overlaps: directory.categories },
        id: { $ne: directory.id },
        status: "live",
      },
      {
        sort: { upvotes: -1, premium_badge: -1, created_at: -1 },
        limit: 3,
      }
    );

    // Get current competition for this directory
    const competitions = directory.weekly_competition_id
      ? await db.find("competitions", {
          id: directory.weekly_competition_id, // Query by UUID
        })
      : [];

    // Format response
    const directoryWithMetadata = {
      ...directory,
      userVoted,
      views: directory.views, // View count already incremented in database
      relatedDirectories: relatedDirectories,
      competitions: competitions,
    };

    return NextResponse.json({
      success: true,
      data: {
        directory: directoryWithMetadata,
      },
    });

  } catch (error) {
    console.error("Directory detail API error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// PATCH /api/directories/[slug] - Update directory (for owner/admin)
export async function PATCH(request, { params }) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter is required", code: "MISSING_SLUG" },
        { status: 400 }
      );
    }

    // Check authentication
    // For now, we'll skip authentication to get the basic functionality working
    // TODO: Implement proper authentication with NextAuth v5
    const session = { user: { id: "demo-user", name: "Demo User" } };

    const body = await request.json();
    const updates = { ...body }; // updated_at is handled by DB triggers

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.slug;
    delete updates.upvotes;
    delete updates.views;
    delete updates.createdAt;

    // Find and update directory
    const result = await db.updateOne(
      "apps",
      { slug },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Directory not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get updated directory
    const updatedDirectory = await db.findOne("apps", { slug });

    return NextResponse.json({
      success: true,
      data: {
        directory: updatedDirectory,
        message: "Directory updated successfully",
      },
    });

  } catch (error) {
    console.error("Directory update API error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}