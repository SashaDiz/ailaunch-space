import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { db } from '@/lib/supabase/database';

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
      getSupabaseUrl(),
      getSupabasePublishableKey(),
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Check access: owner can always see; others only if the project has started
    const isOwner = user && project.submitted_by === user.id;
    
    if (!isOwner) {
      // For non-owners: check status and dates
      // 1. Project must be "live" (not draft/pending)
      if (project.status !== "live") {
        return NextResponse.json(
          { error: "Project not found or access denied", code: "NOT_FOUND" },
          { status: 404 }
        );
      }
      
      // 2. If the project has a competition, ensure it has already started (not Scheduled)
      if (project.weekly_competition_id) {
        const competition = await db.findOne("competitions", {
          id: project.weekly_competition_id,
        });
        
        if (competition) {
          const now = new Date();
          const startDate = new Date(competition.start_date);
          
          // If competition has not started yet — access denied (project is "Scheduled")
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

    // Get user's vote, bookmark, and rating status if authenticated
    const userVoted = false;
    let userBookmarked = false;
    let userRating: number | null = null;

    if (user?.id) {
      const [bookmark, rating] = await Promise.all([
        db.findOne("bookmarks", { user_id: user.id, app_id: project.id }),
        db.findOne("ratings", { user_id: user.id, app_id: project.id }),
      ]);
      userBookmarked = !!bookmark;
      userRating = rating?.rating ?? null;
    }

    // Get related projects with improved algorithm
    // First, try to get projects with exact category matches

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

    // If we don't have enough related projects, get more from any category
    if (relatedProjects.length < 6) {
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
      
      relatedProjects = [...relatedProjects, ...additionalProjects];
    }

    // Limit to 6 projects maximum
    relatedProjects = relatedProjects.slice(0, 6);

    // Get current competition for this project and determine status
    const competitions = project.weekly_competition_id
      ? await db.find("competitions", {
          id: project.weekly_competition_id, // Query by UUID
        })
      : [];
    
    // Determine project status and voting availability
    let statusBadge = "live";
    let canVote = false;
    let competitionStatus = "unknown";
    
    // Check if project is a draft or premium without payment - should show as draft
    const isDraft = project.is_draft === true || project.status === "draft";
    const isPremiumUnpaid = project.plan === "premium" && project.payment_status !== true;
    
    if (isDraft || isPremiumUnpaid) {
      statusBadge = "draft";
      canVote = false;
    } else if (competitions.length > 0) {
      const competition = competitions[0];
      const now = new Date();
      const startDate = new Date(competition.start_date);
      const endDate = new Date(competition.end_date);
      
      if (now < startDate) {
        // Competition has not started yet
        statusBadge = "scheduled";
        canVote = false;
        competitionStatus = "upcoming";
      } else if (now >= startDate && now <= endDate) {
        // Competition is currently active
        statusBadge = "live";
        canVote = true;
        competitionStatus = "active";
      } else {
        // Competition has ended
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
      userBookmarked,
      userRating,
      views: project.views, // View count already incremented in database
      relatedProjects: relatedProjects,
      competitions: competitions,
      statusBadge: statusBadge, // "scheduled", "live", "past" — shown to owner in dashboard
      canVote: canVote, // Whether the user can vote for this project
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
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter is required", code: "MISSING_SLUG" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      getSupabaseUrl(),
      getSupabasePublishableKey(),
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const existingProject = await db.findOne("apps", { slug });
    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (existingProject.submitted_by !== user.id) {
      const { checkIsAdmin } = await import("@/lib/supabase/auth");
      const isAdmin = await checkIsAdmin(user.id);
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Forbidden", code: "FORBIDDEN" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const updates = { ...body }; // updated_at is handled by DB triggers

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.slug;
    delete updates.upvotes;
    delete updates.views;
    delete updates.createdAt;

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