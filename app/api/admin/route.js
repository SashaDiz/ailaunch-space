import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "../../libs/supabase.js";
import { checkIsAdmin } from "../../libs/auth.js";
import { db } from "../../libs/database.js";
import { emailNotifications } from "../../libs/email.js";
import { webhookEvents } from "../../libs/webhooks.js";
import { notificationManager } from "../../libs/notification-service.js";
import { 
  toggleLinkType, 
  upgradeToDofollow, 
  downgradeToNofollow,
  getLinkTypeStats,
  getLinkTypeHistory,
  bulkUpdateLinkTypes,
  awardDofollowToWeeklyWinners
} from "../../libs/linkTypeManager.js";

// Admin authentication middleware
async function checkAdminAuth() {
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

  // Use getUser() instead of getSession() for security
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return { error: NextResponse.json(
      { error: "Authentication required", code: "UNAUTHORIZED" },
      { status: 401 }
    )};
  }

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) {
    return { error: NextResponse.json(
      { error: "Admin access required", code: "FORBIDDEN" },
      { status: 403 }
    )};
  }

  return { session: { user } };
}

// GET /api/admin?type=directories|competitions|stats|link-type|completable-competitions&...
export async function GET(request) {
  try {
    const authCheck = await checkAdminAuth();
    if (authCheck.error) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // If no type provided, just return success (admin check)
    if (!type) {
      return NextResponse.json({
        success: true,
        message: "Admin access granted",
        user: authCheck.session.user
      });
    }

    switch (type) {
      case "directories":
        return await getDirectories(searchParams);
      case "competitions":
        return await getCompetitions(searchParams);
      case "stats":
        return await getStats(searchParams);
      case "link-type":
        return await getLinkTypeInfo(searchParams);
      case "completable-competitions":
        return await getCompletableCompetitions();
      default:
        return NextResponse.json(
          { error: "Invalid type parameter. Use: directories, competitions, stats, link-type, completable-competitions" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin?type=directories&id=...
export async function PUT(request) {
  try {
    const authCheck = await checkAdminAuth();
    if (authCheck.error) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    switch (type) {
      case "directories":
        return await updateDirectory(id, request);
      case "competitions":
        return await updateCompetition(id, request);
      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin - Handle various admin actions
export async function POST(request) {
  try {
    const authCheck = await checkAdminAuth();
    if (authCheck.error) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "approve-directory":
        return await approveDirectory(request, authCheck.session);
      case "complete-competition":
        return await completeCompetition(request);
      case "link-type":
        return await updateLinkType(request, authCheck.session);
      case "winner-badge":
        return await updateWinnerBadge(request, authCheck.session);
      default:
        return NextResponse.json(
          { error: "Invalid action parameter. Use: approve-directory, complete-competition, link-type, winner-badge" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Admin API POST error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin?type=directories&id=...
export async function DELETE(request) {
  try {
    const authCheck = await checkAdminAuth();
    if (authCheck.error) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    switch (type) {
      case "directories":
        return await deleteDirectory(id);
      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
async function getDirectories(searchParams) {
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "25");
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");
  const search = searchParams.get("search");

  const filter = {};
  
  if (status && status !== "all") {
    filter.status = status;
  }

  if (plan && plan !== "all") {
    filter.plan = plan;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { short_description: { $regex: search, $options: "i" } },
      { website_url: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  
  const [directories, total] = await Promise.all([
    db.find("apps", filter, {
      skip,
      limit,
      sort: { created_at: -1 },
    }),
    db.count("apps", filter),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      directories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
}

async function getCompetitions(searchParams) {
  const competitions = await db.find("launch_weeks", {}, {
    sort: { start_date: -1 },
    limit: 50,
  });

  return NextResponse.json({
    success: true,
    data: { competitions },
  });
}

async function getStats(searchParams) {
  try {
    // Simple counts without complex aggregations
    const [
      totalDirectories,
      pendingDirectories,
      allVotes,
    ] = await Promise.all([
      db.count("apps").catch(err => {
        console.error("Error counting apps:", err);
        return 0;
      }),
      db.count("apps", { status: "pending" }).catch(err => {
        console.error("Error counting pending apps:", err);
        return 0;
      }),
      // Get all votes and count them client-side to avoid aggregate
      db.find("votes", {}, { limit: 100000 }).then(votes => votes.length).catch(err => {
        console.error("Error counting votes:", err);
        return 0;
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalDirectories,
        pendingDirectories,
        totalVotes: allVotes,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    // Return default stats on error
    return NextResponse.json({
      success: true,
      data: {
        totalDirectories: 0,
        pendingDirectories: 0,
        totalVotes: 0,
      },
    });
  }
}

async function updateDirectory(id, request) {
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { error: "Invalid directory ID" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { status, plan, featured, notes } = body;

  const updateData = {
    updated_at: new Date(),
  };

  if (status !== undefined) updateData.status = status;
  if (plan !== undefined) updateData.plan = plan;
  if (featured !== undefined) updateData.featured = featured;
  if (notes !== undefined) updateData.admin_notes = notes;

  const result = await db.updateOne(
    "apps",
    { id: id },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: "Directory not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Directory updated successfully",
  });
}

async function updateCompetition(id, request) {
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { error: "Invalid competition ID" },
      { status: 400 }
    );
  }

  const body = await request.json();
  
  const result = await db.updateOne(
    "launch_weeks",
    { id: id },
    { $set: { ...body, updated_at: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: "Competition not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Competition updated successfully",
  });
}

async function deleteDirectory(id) {
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { error: "Invalid directory ID" },
      { status: 400 }
    );
  }

  const result = await db.deleteOne("apps", { id: id });

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: "Directory not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Directory deleted successfully",
  });
}

// Approve or reject a directory submission
async function approveDirectory(request, session) {
  const body = await request.json();
  const { directoryId, action, rejectionReason } = body;

  // Validate input
  if (!directoryId || !action) {
    return NextResponse.json(
      { error: "directoryId and action are required", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json(
      { error: "Action must be 'approve' or 'reject'", code: "INVALID_ACTION" },
      { status: 400 }
    );
  }

  if (action === 'reject' && !rejectionReason) {
    return NextResponse.json(
      { error: "Rejection reason is required when rejecting", code: "MISSING_REASON" },
      { status: 400 }
    );
  }

  // Fetch the directory
  const directory = await db.findOne("apps", { id: directoryId });

  if (!directory) {
    return NextResponse.json(
      { error: "Directory not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  // Get user email for notifications
  const user = await db.findOne("users", { id: directory.submitted_by });
  const userEmail = user?.email || directory.contact_email;

  if (action === 'approve') {
    // Check the competition status to determine directory status
    let directoryStatus = 'live'; // Default to live if no competition
    let shouldPublishNow = true;
    
    if (directory.weekly_competition_id) {
      const competition = await db.findOne("competitions", { id: directory.weekly_competition_id });
      
      if (competition) {
        // If competition is upcoming, set directory to scheduled
        // If competition is active, set directory to live
        // If competition is completed/cancelled, set directory to live (fallback)
        if (competition.status === 'upcoming') {
          directoryStatus = 'scheduled';
          shouldPublishNow = false;
        } else if (competition.status === 'active') {
          directoryStatus = 'live';
          shouldPublishNow = true;
        }
      }
    }
    
    // Approve the directory
    const updateData = {
      status: directoryStatus,
      approved: true,
      // updated_at is handled by DB triggers
    };
    
    // Only set publish/launch dates if going live immediately
    if (shouldPublishNow) {
      updateData.published_at = new Date();
      updateData.launched_at = new Date();
      updateData.homepage_start_date = new Date();
      updateData.homepage_end_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }

    // If premium plan, set dofollow status
    if (directory.plan === 'premium') {
      updateData.dofollow_status = true;
      updateData.link_type = 'dofollow';
      updateData.dofollow_reason = 'premium_plan';
      updateData.dofollow_awarded_at = new Date();
    }

    const result = await db.updateOne(
      "apps",
      { id: directoryId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update directory", code: "UPDATE_FAILED" },
        { status: 500 }
      );
    }

    // Send approval notification
    try {
      if (userEmail && user) {
        await notificationManager.sendSubmissionApprovalNotification({
          userId: user.id,
          userEmail: userEmail,
          directory: {
            id: directory.id,
            name: directory.name,
            slug: directory.slug
          }
        });
      }
    } catch (notificationError) {
      console.error("Failed to send approval notification:", notificationError);
      
      // Fallback to legacy email system
      try {
        if (userEmail) {
          await emailNotifications.directoryApproved(userEmail, {
            directoryName: directory.name,
            slug: directory.slug,
          });
        }
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
      }
    }

    // Trigger webhook for approved directory
    try {
      await webhookEvents.directoryApproved(directory);
    } catch (webhookError) {
      console.error("Failed to trigger webhook:", webhookError);
    }

    return NextResponse.json({
      success: true,
      message: directoryStatus === 'scheduled' 
        ? "Directory approved and scheduled for launch" 
        : "Directory approved and is now live",
      data: {
        directoryId,
        status: directoryStatus,
        emailSent: !!userEmail,
        scheduledForLaunch: directoryStatus === 'scheduled',
      },
    });

  } else if (action === 'reject') {
    // Reject the directory
    const updateData = {
      status: 'rejected',
      approved: false,
      rejection_reason: rejectionReason,
      // updated_at is handled by DB triggers
    };

    const result = await db.updateOne(
      "apps",
      { id: directoryId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update directory", code: "UPDATE_FAILED" },
        { status: 500 }
      );
    }

    // Send rejection notification
    try {
      if (userEmail && user) {
        await notificationManager.sendSubmissionDeclineNotification({
          userId: user.id,
          userEmail: userEmail,
          directory: {
            id: directory.id,
            name: directory.name,
            slug: directory.slug
          },
          rejectionReason: rejectionReason
        });
      }
    } catch (notificationError) {
      console.error("Failed to send rejection notification:", notificationError);
      
      // Fallback to legacy email system
      try {
        if (userEmail) {
          await emailNotifications.directoryRejected(userEmail, {
            directoryName: directory.name,
            rejectionReason: rejectionReason,
          });
        }
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }
    }

    // Trigger webhook for rejected directory
    try {
      await webhookEvents.directoryRejected(directory, rejectionReason);
    } catch (webhookError) {
      console.error("Failed to trigger webhook:", webhookError);
    }

    return NextResponse.json({
      success: true,
      message: "Directory rejected successfully",
      data: {
        directoryId,
        status: 'rejected',
        rejectionReason,
        emailSent: !!userEmail,
      },
    });
  }
}

// Complete a weekly competition and award dofollow links
async function completeCompetition(request) {
  const body = await request.json();
  const { competitionId } = body;

  if (!competitionId) {
    return NextResponse.json(
      { error: "competitionId is required (e.g., '2024-W01')" },
      { status: 400 }
    );
  }

  // Verify competition exists and is active
  const competition = await db.findOne("competitions", {
    competition_id: competitionId,
    type: "weekly",
  });

  if (!competition) {
    return NextResponse.json(
      { error: "Competition not found" },
      { status: 404 }
    );
  }

  if (competition.status === "completed") {
    return NextResponse.json(
      { error: "Competition already completed", competition },
      { status: 400 }
    );
  }

  // Award dofollow to winners
  const winners = await awardDofollowToWeeklyWinners(competitionId);

  return NextResponse.json({
    success: true,
    message: `Competition ${competitionId} completed. Awarded dofollow to ${winners.length} winners.`,
    competition: {
      id: competitionId,
      winnersCount: winners.length,
      winners: winners.map((w, i) => ({
        position: i + 1,
        name: w.name,
        slug: w.slug,
        upvotes: w.upvotes,
      })),
    },
  });
}

// Get completable competitions
async function getCompletableCompetitions() {
  // Find active competitions that have ended
  const now = new Date();
  const endedCompetitions = await db.find("competitions", {
    type: "weekly",
    status: "active",
    end_date: { $lte: now },
  }, {
    sort: { end_date: -1 }
  });

  // Get submission counts for each
  const competitionsWithStats = await Promise.all(
    endedCompetitions.map(async (comp) => {
      const standardSubmissions = await db.find("apps", {
        weekly_competition_id: comp.id, // UUID reference
        plan: "standard",
        status: "live",
      }, {
        sort: { upvotes: -1, premium_badge: -1, created_at: -1 },
        limit: 3
      });

      return {
        ...comp,
        topThree: standardSubmissions.map((s, i) => ({
          position: i + 1,
          name: s.name,
          slug: s.slug,
          upvotes: s.upvotes,
        })),
      };
    })
  );

  return NextResponse.json({
    success: true,
    competitions: competitionsWithStats,
    count: competitionsWithStats.length,
  });
}

// Get link type information
async function getLinkTypeInfo(searchParams) {
  const action = searchParams.get("action");
  const directoryId = searchParams.get("directoryId");

  // Get link type statistics
  if (action === "stats") {
    const stats = await getLinkTypeStats();
    return NextResponse.json({ success: true, stats });
  }

  // Get link type history for a directory
  if (action === "history" && directoryId) {
    const history = await getLinkTypeHistory(directoryId);
    return NextResponse.json({ success: true, history });
  }

  return NextResponse.json({ error: "Invalid action or missing directoryId" }, { status: 400 });
}

// Update link type for directories
async function updateLinkType(request, session) {
  const body = await request.json();
  const { action, directoryId, linkType, directoryIds } = body;

  if (!action) {
    return NextResponse.json({ error: "Action is required" }, { status: 400 });
  }

  let result;

  switch (action) {
    case "toggle":
      if (!directoryId) {
        return NextResponse.json(
          { error: "directoryId is required" },
          { status: 400 }
        );
      }
      result = await toggleLinkType(directoryId, session.user.id);
      return NextResponse.json({
        success: true,
        message: `Link type changed to ${result.link_type}`,
        directory: result,
      });

    case "upgrade":
      if (!directoryId) {
        return NextResponse.json(
          { error: "directoryId is required" },
          { status: 400 }
        );
      }
      result = await upgradeToDofollow(directoryId, session.user.id);
      return NextResponse.json({
        success: true,
        message: "Upgraded to dofollow",
        directory: result,
      });

    case "downgrade":
      if (!directoryId) {
        return NextResponse.json(
          { error: "directoryId is required" },
          { status: 400 }
        );
      }
      result = await downgradeToNofollow(directoryId, session.user.id);
      return NextResponse.json({
        success: true,
        message: "Downgraded to nofollow",
        directory: result,
      });

    case "bulk":
      if (!directoryIds || !Array.isArray(directoryIds)) {
        return NextResponse.json(
          { error: "directoryIds array is required" },
          { status: 400 }
        );
      }
      if (!linkType || !["dofollow", "nofollow"].includes(linkType)) {
        return NextResponse.json(
          { error: "Valid linkType is required (dofollow or nofollow)" },
          { status: 400 }
        );
      }

      const updates = directoryIds.map(id => ({
        directoryId: id,
        linkType: linkType,
      }));

      result = await bulkUpdateLinkTypes(updates, session.user.id);
      return NextResponse.json({
        success: true,
        message: `Bulk update completed: ${result.successful} successful, ${result.failed} failed`,
        result,
      });

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}

// Update winner badge for a directory
async function updateWinnerBadge(request, session) {
  try {
    const body = await request.json();
    const { action, directoryId, weekly_position } = body;

    if (!directoryId) {
      return NextResponse.json(
        { error: "directoryId is required" },
        { status: 400 }
      );
    }

    // Validate weekly_position if provided
    if (weekly_position !== null && (weekly_position < 1 || weekly_position > 3)) {
      return NextResponse.json(
        { error: "weekly_position must be 1, 2, 3, or null" },
        { status: 400 }
      );
    }

    // Get the directory to verify it exists
    const directory = await db.findOne("apps", { id: directoryId });
    if (!directory) {
      return NextResponse.json(
        { error: "Directory not found" },
        { status: 404 }
      );
    }

    // Update the directory with new winner position
    const updateData = {
      weekly_position: weekly_position,
      updated_at: new Date()
    };

    // If setting a winner position, also update link type to dofollow if it's not already
    if (weekly_position && weekly_position >= 1 && weekly_position <= 3) {
      updateData.link_type = "dofollow";
      updateData.dofollow_status = true;
      updateData.dofollow_reason = "weekly_winner";
      updateData.dofollow_awarded_at = new Date();
    } else if (weekly_position === null) {
      // If removing winner badge, keep link type but update reason
      if (directory.dofollow_reason === "weekly_winner") {
        updateData.dofollow_reason = "manual_upgrade";
      }
    }

    const updatedDirectory = await db.updateOne("apps", { id: directoryId }, updateData);

    if (!updatedDirectory) {
      return NextResponse.json(
        { error: "Failed to update directory" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: weekly_position 
        ? `Winner badge updated to ${weekly_position}${weekly_position === 1 ? 'st' : weekly_position === 2 ? 'nd' : 'rd'} place`
        : "Winner badge removed",
      directory: updatedDirectory,
    });

  } catch (error) {
    console.error("Winner badge update error:", error);
    return NextResponse.json(
      { error: "Failed to update winner badge", details: error.message },
      { status: 500 }
    );
  }
}