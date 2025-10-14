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

    // Check access: владелец может видеть всегда, остальные - только если проект уже начался
    const isOwner = user && directory.submitted_by === user.id;
    
    if (!isOwner) {
      // Для не-владельцев: проверяем статус и даты
      // 1. Проект должен быть "live" (не draft/pending)
      if (directory.status !== "live") {
        return NextResponse.json(
          { error: "Directory not found or access denied", code: "NOT_FOUND" },
          { status: 404 }
        );
      }
      
      // 2. Если у проекта есть конкурс, проверяем что он уже начался (не Scheduled)
      if (directory.weekly_competition_id) {
        const competition = await db.findOne("competitions", {
          id: directory.weekly_competition_id,
        });
        
        if (competition) {
          const now = new Date();
          const startDate = new Date(competition.start_date);
          
          // Если конкурс ещё не начался - доступ запрещён (проект в статусе "Scheduled")
          if (now < startDate) {
            return NextResponse.json(
              { error: "Directory not found or access denied", code: "NOT_FOUND" },
              { status: 404 }
            );
          }
        }
      }
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

    // Get current competition for this directory and determine status
    const competitions = directory.weekly_competition_id
      ? await db.find("competitions", {
          id: directory.weekly_competition_id, // Query by UUID
        })
      : [];
    
    // Определяем статус проекта и доступность голосования
    let statusBadge = "live";
    let canVote = false;
    let competitionStatus = "unknown";
    
    if (competitions.length > 0) {
      const competition = competitions[0];
      const now = new Date();
      const startDate = new Date(competition.start_date);
      const endDate = new Date(competition.end_date);
      
      if (now < startDate) {
        // Конкурс ещё не начался
        statusBadge = "scheduled";
        canVote = false;
        competitionStatus = "upcoming";
      } else if (now >= startDate && now <= endDate) {
        // Конкурс идёт прямо сейчас
        statusBadge = "live";
        canVote = true;
        competitionStatus = "active";
      } else {
        // Конкурс закончился
        statusBadge = "past";
        canVote = false;
        competitionStatus = "completed";
      }
    }

    // Format response
    const directoryWithMetadata = {
      ...directory,
      userVoted,
      views: directory.views, // View count already incremented in database
      relatedDirectories: relatedDirectories,
      competitions: competitions,
      statusBadge: statusBadge, // "scheduled", "live", "past" - виден только владельцу в dashboard
      canVote: canVote, // можно ли голосовать за этот проект
      competitionStatus: competitionStatus,
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