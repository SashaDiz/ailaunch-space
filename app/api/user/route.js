import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../libs/supabase.js";
import { db } from "../../libs/database.js";
import { getSession } from "../../libs/auth-supabase.js";
import { notificationManager } from "../../libs/notification-service.js";

// User authentication middleware
async function checkUserAuth() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    return { error: NextResponse.json(
      { error: "Authentication required", code: "UNAUTHORIZED" },
      { status: 401 }
    )};
  }

  return { session: { user: session.user } };
}

// GET /api/user?type=projects|stats
export async function GET(request) {
  try {
    const authCheck = await checkUserAuth();
    if (authCheck.error) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    switch (type) {
      case "projects":
        return await getUserProjects(authCheck.session, searchParams);
      case "stats":
        return await getUserStats(authCheck.session, searchParams);
      case "profile":
        return await getUserProfile(authCheck.session);
      default:
        return NextResponse.json(
          { error: "Invalid type parameter. Use: projects, stats, profile" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("User API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
async function getUserProjects(session, searchParams) {
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50"); // Increased default limit
  const status = searchParams.get("status");
  
  const filter = { submitted_by: session.user.id };
  
  if (status && status !== "all") {
    filter.status = status;
  }

  const skip = (page - 1) * limit;
  
  const [projects, total] = await Promise.all([
    db.find("apps", filter, {
      skip,
      limit,
      sort: { created_at: -1 },
    }),
    db.count("apps", filter),
  ]);

  // Add competition status and status badges to projects
  const now = new Date();
  const projectsWithStatus = await Promise.all(
    projects.map(async (project) => {
      let statusBadge = "live"; // Default badge
      let canVote = false;
      
      if (project.weekly_competition_id) {
        const competition = await db.findOne("competitions", {
          id: project.weekly_competition_id,
        });
        
        if (competition) {
          const startDate = new Date(competition.start_date);
          const endDate = new Date(competition.end_date);
          
          // Determine competition status and voting availability
          if (endDate < now) {
            // Competition is completed
            statusBadge = "past";
            canVote = false;
          } else if (startDate > now) {
            // Competition hasn't started yet
            statusBadge = "scheduled";
            canVote = false;
          } else {
            // Competition is currently active
            statusBadge = "live";
            canVote = true;
          }
        }
      }
      
      return {
        ...project,
        statusBadge: statusBadge,
        canVote: canVote,
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: {
      projects: projectsWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
}

async function getUserStats(session, searchParams) {
  const userId = session.user.id;

  // Get user's projects for calculations
  const projects = await db.find("apps", { submitted_by: userId });

  // Get user data for votes cast
  const userData = await db.findOne("users", { id: userId });

  // Calculate stats
  const totalProjects = projects.length;
  const totalVotesReceived = projects.reduce(
    (sum, project) => sum + (project.upvotes || 0),
    0
  );
  const totalVotesCast = userData?.total_votes || 0; // Votes cast by this user
  const totalViews = projects.reduce(
    (sum, project) => sum + (project.views || 0),
    0
  );
  const totalClicks = projects.reduce(
    (sum, project) => sum + (project.clicks || 0),
    0
  );

  // Find best rankings
  const weeklyPositions = projects
    .filter((project) => project.weekly_position)
    .map((project) => project.weekly_position);

  const bestWeeklyRank =
    weeklyPositions.length > 0 ? Math.min(...weeklyPositions) : null;
  const overallBestRank = bestWeeklyRank;

  // Count winners
  const weeklyWins = projects.filter((project) => project.weekly_winner).length;

  // Count by status
  const liveProjects = projects.filter(
    (project) => project.status === "live"
  ).length;
  const scheduledProjects = projects.filter(
    (project) => project.status === "scheduled"
  ).length;
  const pendingProjects = projects.filter(
    (project) => project.status === "pending"
  ).length;

  // Get dofollow links count
  const totalDofollow = projects.reduce(
    (sum, project) => sum + (project.dofollow_links_earned || 0),
    0
  );

  return NextResponse.json({
    success: true,
    data: {
      totalProjects,
      totalVotesReceived,
      totalVotesCast,
      totalViews,
      totalClicks,
      bestRank: overallBestRank,
      bestWeeklyRank,
      weeklyWins,
      liveProjects,
      scheduledProjects,
      pendingProjects,
      totalEngagement: totalVotesReceived + totalViews + totalClicks,
      totalDofollow,
      // Additional stats for compatibility
      totalSubmissions: totalProjects,
      totalVotes: totalVotesCast, // This represents votes cast by user
      approvedSubmissions: liveProjects,
    },
  });
}

async function getUserProfile(session) {
  const userId = session.user.id;

  // Get user profile data from database
  const userProfile = await db.findOne("users", { id: userId });
  
  if (!userProfile) {
    return NextResponse.json(
      { error: "User profile not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: userProfile.id,
      full_name: userProfile.full_name,
      bio: userProfile.bio,
      twitter: userProfile.twitter,
      website: userProfile.website,
      github: userProfile.github,
      linkedin: userProfile.linkedin,
      location: userProfile.location,
      avatar_url: userProfile.avatar_url,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at
    }
  });
}

// PUT /api/user - Update user profile
export async function PUT(request) {
  try {
    const authCheck = await checkUserAuth();
    if (authCheck.error) return authCheck.error;

    const userId = authCheck.session.user.id;
    const body = await request.json();
    
    const { 
      full_name, 
      bio, 
      twitter, 
      website, 
      github, 
      linkedin, 
      location,
      avatar_url
    } = body;

    // Validate required fields
    if (!full_name || full_name.trim().length === 0) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      full_name: full_name.trim(),
      bio: bio?.trim() || null,
      twitter: twitter?.trim() || null,
      website: website?.trim() || null,
      github: github?.trim() || null,
      linkedin: linkedin?.trim() || null,
      location: location?.trim() || null,
      avatar_url: avatar_url?.trim() || null,
      updated_at: new Date().toISOString()
    };

    // Update user in database
    const result = await db.updateOne("users", { id: userId }, { $set: updateData });
    
    if (!result || result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: updateData
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { 
        error: "Failed to update profile",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/user - Delete user account and all associated data
export async function DELETE(request) {
  try {
    const authCheck = await checkUserAuth();
    if (authCheck.error) return authCheck.error;

    const userId = authCheck.session.user.id;
    const supabaseAdmin = getSupabaseAdmin();

    // Get user data before deletion for notification
    const userData = await db.findOne("users", { id: userId });

    // Send account deletion notification before deleting
    try {
      if (userData?.email) {
        await notificationManager.sendAccountDeletionNotification({
          id: userId,
          email: userData.email,
          full_name: userData.full_name,
          first_name: userData.first_name
        });
      }
    } catch (notificationError) {
      console.error("Failed to send account deletion notification:", notificationError);
      // Continue with deletion even if notification fails
    }

    // Delete user's projects/apps
    await db.deleteMany("apps", { submitted_by: userId });

    // Delete user's votes
    await db.deleteMany("votes", { user_id: userId });

    // Delete user record from users table
    await db.deleteOne("users", { id: userId });

    // Delete user from Supabase Auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (deleteError) {
      console.error("Error deleting user from Supabase Auth:", deleteError);
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete account",
        details: error.message 
      },
      { status: 500 }
    );
  }
}