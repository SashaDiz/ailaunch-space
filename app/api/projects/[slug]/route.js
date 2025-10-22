import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "../../../libs/database.js";

// GET /api/projects/[slug] - Get project by slug or ID
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
    const isOwner = user && project.submitted_by === user.id;
    
    if (!isOwner) {
      // Для не-владельцев: проверяем статус и даты
      // 1. Проект должен быть "live" (не draft/pending)
      if (project.status !== "live") {
        return NextResponse.json(
          { error: "Project not found or access denied", code: "NOT_FOUND" },
          { status: 404 }
        );
      }
      
      // 2. Если у проекта есть конкурс, проверяем что он уже начался (не Scheduled)
      if (project.weekly_competition_id) {
        const competition = await db.findOne("competitions", {
          id: project.weekly_competition_id,
        });
        
        if (competition) {
          const now = new Date();
          const startDate = new Date(competition.start_date);
          
          // Если конкурс ещё не начался - доступ запрещён (проект в статусе "Scheduled")
          if (now < startDate) {
            return NextResponse.json(
              { error: "Project not found or access denied", code: "NOT_FOUND" },
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
        { id: project.id },
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
        app_id: project.id,
      });
      userVoted = !!vote;
    }

    // Get related projects with improved algorithm
    // First, try to get projects with exact category matches
    console.log("Current project categories:", project.categories);
    
    // Try to find projects that share at least one category
    let relatedProjects = [];
    
    if (project.categories && project.categories.length > 0) {
      relatedProjects = await db.find(
        "apps",
        {
          categories: { $overlaps: project.categories },
          id: { $ne: project.id },
          status: { $in: ["live", "past"] },
        },
        {
          sort: { 
            upvotes: -1, 
            premium_badge: -1, 
            created_at: -1 
          },
          limit: 6,
        }
      );
    }
    
    console.log("Found related projects with category overlap:", relatedProjects.length);
    console.log("Related projects categories:", relatedProjects.map(p => ({ name: p.name, categories: p.categories })));

    // If we don't have enough related projects, get more from any category
    if (relatedProjects.length < 6) {
      console.log("Not enough category-matched projects, fetching additional ones...");
      const excludeIds = relatedProjects.map(p => p.id);
      excludeIds.push(project.id); // Also exclude current project
      
      const additionalProjects = await db.find(
        "apps",
        {
          id: { $nin: excludeIds },
          status: { $in: ["live", "past"] },
        },
        {
          sort: { 
            upvotes: -1, 
            premium_badge: -1, 
            created_at: -1 
          },
          limit: 6 - relatedProjects.length,
        }
      );
      
      console.log("Additional projects found:", additionalProjects.length);
      relatedProjects = [...relatedProjects, ...additionalProjects];
    }

    // Limit to 6 projects maximum
    relatedProjects = relatedProjects.slice(0, 6);
    console.log("Final related projects count:", relatedProjects.length);

    // Get current competition for this project and determine status
    const competitions = project.weekly_competition_id
      ? await db.find("competitions", {
          id: project.weekly_competition_id, // Query by UUID
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

    // Get user information for the project
    let userInfo = null;
    if (project.submitted_by) {
      try {
        const user = await db.findOne("users", { id: project.submitted_by });
        if (user) {
          userInfo = {
            id: user.id,
            name: user.full_name || user.name || "Anonymous",
            avatar: user.avatar_url,
            bio: user.bio,
            twitter: user.twitter,
            website: user.website
          };
        }
      } catch (error) {
        console.error("Error fetching user info for project:", error);
      }
    }

    // Format response
    const projectWithMetadata = {
      ...project,
      userVoted,
      views: project.views, // View count already incremented in database
      relatedProjects: relatedProjects,
      competitions: competitions,
      statusBadge: statusBadge, // "scheduled", "live", "past" - виден только владельцу в dashboard
      canVote: canVote, // можно ли голосовать за этот проект
      competitionStatus: competitionStatus,
      user: userInfo,
    };

    return NextResponse.json({
      success: true,
      data: {
        project: projectWithMetadata,
      },
    });

  } catch (error) {
    console.error("Project detail API error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[slug] - Update project (for owner/admin)
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

    // Find and update project
    const result = await db.updateOne(
      "apps",
      { slug },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Project not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get updated project
    const updatedProject = await db.findOne("apps", { slug });

    return NextResponse.json({
      success: true,
      data: {
        project: updatedProject,
        message: "Project updated successfully",
      },
    });

  } catch (error) {
    console.error("Project update API error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}