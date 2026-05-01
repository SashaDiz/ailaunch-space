import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { checkIsAdmin } from '@/lib/supabase/auth';
import { db } from '@/lib/supabase/database';
import { emailNotifications } from '@/lib/email';
import { webhookEvents } from '@/lib/webhooks';
import { notificationManager } from '@/lib/notifications';
import { 
  toggleLinkType, 
  upgradeToDofollow, 
  downgradeToNofollow,
  getLinkTypeStats,
  getLinkTypeHistory,
  bulkUpdateLinkTypes,
} from '@/lib/link-type-manager';
import { verifyStripeSession, isStripeConfigured, getStripeRevenue } from '@/lib/payments/polar';

// Admin authentication middleware
// Supports both Supabase session (for browser) and CRON_SECRET (for API calls)
async function checkAdminAuth(request) {
  // Check for CRON_SECRET authentication (for API/script access)
  const authHeader = request.headers.get('authorization');
  const hasCronSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  
  if (hasCronSecret) {
    // CRON_SECRET authentication - allow access
    return { session: { user: { id: 'cron', isAdmin: true } } };
  }

  // Fall back to Supabase session authentication (for browser access)
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

  // Use getUser() instead of getSession() for security
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return { error: NextResponse.json(
      { error: "Authentication required. Use Bearer token with CRON_SECRET or login via browser.", code: "UNAUTHORIZED" },
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

// GET /api/admin?type=projects|competitions|stats|link-type|completable-competitions&...
export async function GET(request) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

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
      case "projects":
        return await getProjects(searchParams);
      case "stats":
        return await getStats(searchParams);
      case "link-type":
        return await getLinkTypeInfo(searchParams);
      default:
        return NextResponse.json(
          { error: "Invalid type parameter. Use: projects, stats, link-type" },
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

// PUT /api/admin?type=projects&id=...
export async function PUT(request) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    switch (type) {
      case "projects":
        return await updateProject(id, request);
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
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "approve-project":
        return await approveProject(request, authCheck.session);
      case "link-type":
        return await updateLinkType(request, authCheck.session);
      case "resend-emails":
        return await resendEmails(request);
      case "fix-premium-projects":
        return await fixPremiumProjects(request);
      case "fix-paid-projects":
        return await fixPaidProjects(request);
      case "check-stripe-sessions":
        return await checkStripeSessions(request);
      case "create-project":
        return await createProjectAdmin(request, authCheck.session);
      default:
        return NextResponse.json(
          { error: "Invalid action parameter." },
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

// DELETE /api/admin?type=projects&id=...
export async function DELETE(request) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    switch (type) {
      case "projects":
        return await deleteProject(id);
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
async function getProjects(searchParams) {
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "25");
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");
  const search = searchParams.get("search");

  // Simplified and optimized filter logic:
  // Show all standard projects (plan != 'premium')  
  // Show only paid premium projects (plan = 'premium' AND payment_status = true AND is_draft = false)
  
  // Build base conditions
  const standardCondition: Record<string, any> = { plan: { $ne: "premium" } };
  const premiumCondition: Record<string, any> = {
    plan: "premium",
    payment_status: true,
    is_draft: false,
  };
  
  // Apply status filter
  if (status && status !== "all") {
    standardCondition.status = status;
    premiumCondition.status = status;
  }

  // Apply plan filter
  if (plan && plan !== "all") {
    if (plan === "premium") {
      // Only query premium projects - set standard to impossible condition
      standardCondition.plan = "nonexistent_plan";
    } else {
      // Only query standard projects - set premium to impossible condition  
      standardCondition.plan = plan;
      premiumCondition.plan = "nonexistent_plan";
    }
  }

  // Apply search filter - handle separately for each condition
  if (search) {
    standardCondition.$or = [
      { name: { $regex: search, $options: "i" } },
      { short_description: { $regex: search, $options: "i" } },
      { website_url: { $regex: search, $options: "i" } },
    ];
    premiumCondition.$or = [
      { name: { $regex: search, $options: "i" } },
      { short_description: { $regex: search, $options: "i" } },
      { website_url: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const sortOptions = { created_at: -1 };

  // Fetch both standard and premium projects, then combine and paginate
  // This approach is more reliable than complex $or queries
  const [standardProjects, premiumProjects, standardCount, premiumCount] = await Promise.all([
    db.find("apps", standardCondition, {
      skip: 0, // Fetch all, paginate after combining
      limit: 10000,
      sort: sortOptions,
    }),
    db.find("apps", premiumCondition, {
      skip: 0,
      limit: 10000,
      sort: sortOptions,
    }),
    db.count("apps", standardCondition),
    db.count("apps", premiumCondition),
  ]);
  
  // Combine and sort all projects
  const allProjects = [...standardProjects, ...premiumProjects];
  
  // Sort by created_at descending
  allProjects.sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateB.getTime() - dateA.getTime();
  });
  
  // Apply pagination after combining
  const total = standardCount + premiumCount;
  const projects = allProjects.slice(skip, skip + limit);

  // Use project status directly (competition-derived status removed)
  const projectsWithLaunchStatus = projects.map((project) => ({
    ...project,
    launch_status: project.status,
  }));

  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    success: true,
    data: {
      projects: projectsWithLaunchStatus,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        // Backwards/forwards compatible keys for the client
        totalCount: total,
        totalPages,
      },
    },
  });
}

async function getCompetitions(_searchParams) {
  return NextResponse.json({
    success: true,
    data: { competitions: [] },
  });
}

async function changeProjectLaunchWeek(request) {
  const body = await request.json();
  const { projectId, competitionId } = body;

  if (!projectId || !competitionId) {
    return NextResponse.json(
      { error: "projectId and competitionId are required" },
      { status: 400 }
    );
  }

  const project = await db.findOne("apps", { id: projectId });
  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  const targetCompetition = await db.findOne("competitions", {
    competition_id: competitionId,
    type: "weekly",
  });

  if (!targetCompetition) {
    return NextResponse.json(
      { error: "Launch week not found" },
      { status: 404 }
    );
  }

  // No change needed
  if (project.launch_week === competitionId) {
    return NextResponse.json({
      success: true,
      data: { project },
    });
  }

  const shouldAdjustCounts =
    project.plan === "standard" || project.payment_status === true;
  const planField =
    project.plan === "premium" ? "premium_submissions" : "standard_submissions";
  const maxStandardSlots = targetCompetition.max_standard_slots ?? 15;
  const maxPremiumSlots = targetCompetition.max_premium_slots ?? 25;

  if (shouldAdjustCounts) {
    const standardFull =
      project.plan === "standard" &&
      (targetCompetition.standard_submissions ?? 0) >= maxStandardSlots;
    const premiumFull =
      project.plan === "premium" &&
      (targetCompetition.total_submissions ?? 0) >= maxPremiumSlots;

    if (standardFull) {
      return NextResponse.json(
        { error: "Selected launch week is full for standard slots" },
        { status: 400 }
      );
    }

    if (premiumFull) {
      return NextResponse.json(
        { error: "Selected launch week is full for premium slots" },
        { status: 400 }
      );
    }
  }

  // Decrement counts on the previous competition (if applicable)
  if (
    shouldAdjustCounts &&
    project.weekly_competition_id &&
    project.weekly_competition_id !== targetCompetition.id
  ) {
    await db.updateOne(
      "competitions",
      { id: project.weekly_competition_id },
      {
        $inc: { total_submissions: -1, [planField]: -1 },
        $set: { updated_at: new Date() },
      }
    );
  }

  // Increment counts on the new competition (if applicable)
  if (shouldAdjustCounts) {
    await db.updateOne(
      "competitions",
      { id: targetCompetition.id },
      {
        $inc: { total_submissions: 1, [planField]: 1 },
        $set: { updated_at: new Date() },
      }
    );
  }

  const launchDate = targetCompetition.start_date
    ? new Date(targetCompetition.start_date)
    : null;
  const launchMonth = launchDate
    ? `${launchDate.getFullYear()}-${String(launchDate.getMonth() + 1).padStart(
        2,
        "0"
      )}`
    : null;

  const updateData = {
    launch_week: competitionId,
    weekly_competition_id: targetCompetition.id,
    launch_date: targetCompetition.start_date,
    launch_month: launchMonth,
    updated_at: new Date(),
  };

  const result = await db.updateOne(
    "apps",
    { id: projectId },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  const updatedProject = await db.findOne("apps", { id: projectId });

  return NextResponse.json({
    success: true,
    data: { project: updatedProject },
  });
}

async function getStats(searchParams) {
  try {
    const range = searchParams.get("range") || "30d";
    const now = new Date();

    const rangeDays: Record<string, number | null> = {
      "24h": 1, "7d": 7, "30d": 30, "3m": 90, "6m": 180, "12m": 365, "all": null,
    };
    const days = rangeDays[range] ?? 30;
    const startDate = days !== null
      ? new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      : null;
    const prevStartDate = (startDate && days !== null)
      ? new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000)
      : null;

    // Summary counts
    const [totalProjects, liveProjects, pendingProjects, totalUsers] = await Promise.all([
      db.count("apps", {}).catch(() => 0),
      db.count("apps", { status: "live" }).catch(() => 0),
      db.count("apps", { status: "pending" }).catch(() => 0),
      db.count("users", {}).catch(() => 0),
    ]);

    // Aggregate views/clicks from all apps
    const allApps = await db.find("apps", {}, { limit: 100000 }).catch(() => []);
    const totalViews = allApps.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalClicks = allApps.reduce((sum, a) => sum + (a.clicks || 0), 0);

    // Site analytics (visits/visitors time-series)
    const siteAnalytics = await db.find("analytics", {
      target_type: "general",
      target_id: "00000000-0000-0000-0000-000000000001",
      ...(startDate ? { date: { $gte: startDate.toISOString().split("T")[0] } } : {}),
    }, { limit: 100000 }).catch(() => []);
    const totalVisits = siteAnalytics.reduce((sum, a) => sum + (a.unique_visitors || 0), 0);

    const visitsOverTime = siteAnalytics
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
      .map((r) => ({
        date: r.date,
        views: r.views || 0,
        uniqueVisitors: r.unique_visitors || 0,
      }));

    // Revenue from Stripe — fetch from prevStartDate to get both periods in one call
    const allCharges = isStripeConfigured()
      ? await getStripeRevenue(prevStartDate || startDate).catch(() => [])
      : [];

    const startTimestamp = startDate ? Math.floor(startDate.getTime() / 1000) : 0;
    const recentCharges = startDate
      ? allCharges.filter(c => c.created >= startTimestamp)
      : allCharges;
    const prevCharges = (startDate && prevStartDate)
      ? allCharges.filter(c => c.created < startTimestamp)
      : [];

    const totalRevenue = recentCharges.reduce((sum, c) => sum + c.amount / 100, 0);
    const prevTotalRevenue = prevCharges.reduce((sum, c) => sum + c.amount / 100, 0);
    const revenueChangePercent = prevTotalRevenue > 0
      ? Math.round(((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100)
      : null;

    // Revenue time-series — current period
    const toDateKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const revenueMap: Record<string, number> = {};
    for (const charge of recentCharges) {
      const key = toDateKey(new Date(charge.created * 1000));
      revenueMap[key] = (revenueMap[key] || 0) + charge.amount / 100;
    }

    // Revenue time-series — previous period (shift dates forward by `days` to align)
    const prevRevenueMap: Record<string, number> = {};
    if (days !== null) {
      for (const charge of prevCharges) {
        const d = new Date(charge.created * 1000);
        const shifted = new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
        const key = toDateKey(shifted);
        prevRevenueMap[key] = (prevRevenueMap[key] || 0) + charge.amount / 100;
      }
    }

    // Merge into single time-series, fill date gaps
    const allRevenueDates = new Set([...Object.keys(revenueMap), ...Object.keys(prevRevenueMap)]);
    if (startDate && days !== null) {
      for (let i = 0; i < days; i++) {
        const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        allRevenueDates.add(toDateKey(d));
      }
    }
    const revenueOverTime = [...allRevenueDates]
      .sort()
      .map(date => ({
        date,
        revenue: revenueMap[date] || 0,
        prevRevenue: prevRevenueMap[date] || 0,
      }));

    return NextResponse.json({
      success: true,
      data: {
        totalProjects,
        liveProjects,
        pendingProjects,
        totalUsers,
        totalVisits,
        totalViews,
        totalClicks,
        totalRevenue,
        prevTotalRevenue,
        revenueChangePercent,
        revenueOverTime,
        visitsOverTime,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({
      success: true,
      data: {
        totalProjects: 0, liveProjects: 0, pendingProjects: 0,
        totalUsers: 0, totalVisits: 0, totalViews: 0, totalClicks: 0, totalRevenue: 0,
        prevTotalRevenue: 0, revenueChangePercent: null,
        revenueOverTime: [], visitsOverTime: [],
      },
    });
  }
}

async function updateProject(id, request) {
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { error: "Invalid project ID" },
      { status: 400 }
    );
  }

  const body = await request.json();

  const allowedFields = [
    'name', 'slug', 'website_url', 'short_description', 'full_description',
    'categories', 'pricing', 'logo_url', 'screenshots', 'video_url',
    'link_type', 'plan', 'status', 'featured', 'meta_title', 'meta_description',
    'tags', 'dofollow_status', 'premium_badge', 'contact_email',
  ];

  const updateData: Record<string, any> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) updateData[field] = body[field];
  }
  if (body.notes !== undefined) updateData.admin_notes = body.notes;

  const result = await db.updateOne(
    "apps",
    { id: id },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Project updated successfully",
  });
}

async function createProjectAdmin(request, session) {
  try {
    const body = await request.json();
    const { name, website_url } = body;

    if (!name || !website_url) {
      return NextResponse.json(
        { error: "Name and website URL are required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check for duplicate slug
    const existing = await db.findOne("apps", { slug });
    if (existing) {
      return NextResponse.json(
        { error: "A project with this slug already exists" },
        { status: 409 }
      );
    }

    const projectData = {
      name,
      slug,
      website_url,
      short_description: body.short_description || '',
      full_description: body.full_description || '',
      categories: body.categories || [],
      pricing: body.pricing || 'Free',
      logo_url: body.logo_url || '',
      screenshots: body.screenshots || [],
      video_url: body.video_url || '',
      tags: body.tags || [],
      link_type: body.link_type || 'nofollow',
      dofollow_status: body.link_type === 'dofollow',
      plan: body.plan || 'standard',
      status: body.status || 'live',
      approved: true,
      featured: body.featured || false,
      premium_badge: body.plan === 'premium',
      meta_title: body.meta_title || '',
      meta_description: body.meta_description || '',
      contact_email: body.contact_email || '',
      submitted_by: null,
      payment_status: true,
      is_draft: false,
      views: 0,
      upvotes: 0,
      clicks: 0,
    };

    const result = await db.insertOne("apps", projectData);

    return NextResponse.json({
      success: true,
      data: { id: result.insertedId, slug },
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("Error creating project from admin:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
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

async function deleteProject(id) {
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { error: "Invalid project ID" },
      { status: 400 }
    );
  }

  const result = await db.deleteOne("apps", { id: id });

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Project deleted successfully",
  });
}

// Approve or reject a project submission
async function approveProject(request, session) {
  const body = await request.json();
  const { projectId, action, rejectionReason } = body;

  // Validate input
  if (!projectId || !action) {
    return NextResponse.json(
      { error: "projectId and action are required", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  if (!['approve', 'reject', 'resend-approval-email'].includes(action)) {
    return NextResponse.json(
      { error: "Action must be 'approve', 'reject', or 'resend-approval-email'", code: "INVALID_ACTION" },
      { status: 400 }
    );
  }

  if (action === 'reject' && !rejectionReason) {
    return NextResponse.json(
      { error: "Rejection reason is required when rejecting", code: "MISSING_REASON" },
      { status: 400 }
    );
  }

  // Fetch the project
  const project = await db.findOne("apps", { id: projectId });

  if (!project) {
    return NextResponse.json(
      { error: "Project not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  // Get user email for notifications
  const user = await db.findOne("users", { id: project.submitted_by });
  const userEmail = user?.email || project.contact_email;

  // Handle resend approval email action
  if (action === 'resend-approval-email') {
    // Check if project is already approved
    if (!project.approved && project.status !== 'live' && project.status !== 'scheduled') {
      return NextResponse.json(
        { error: "Project is not approved. Use 'approve' action instead.", code: "NOT_APPROVED" },
        { status: 400 }
      );
    }

    // Get competition info for email context
    const projectStatus = project.status || 'live';

    // Send approval notification
    let emailSent = false;
    try {
      if (userEmail && user) {
        await notificationManager.sendSubmissionApprovalNotification({
          userId: user.id,
          userEmail: userEmail,
          project: {
            id: project.id,
            name: project.name,
            slug: project.slug
          },
          competition: null,
          projectStatus
        });
        emailSent = true;
      } else if (userEmail) {
        // Fallback to legacy email system if user doesn't exist but email does
        await emailNotifications.projectApproved(userEmail, {
          projectName: project.name,
          slug: project.slug,
        });
        emailSent = true;
      }
    } catch (notificationError) {
      console.error("Failed to send approval notification:", notificationError);
      
      // Fallback to legacy email system
      try {
        if (userEmail) {
          await emailNotifications.projectApproved(userEmail, {
            projectName: project.name,
            slug: project.slug,
          });
          emailSent = true;
        }
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
        return NextResponse.json(
          { 
            error: "Failed to send approval email", 
            code: "EMAIL_FAILED",
            details: emailError.message 
          },
          { status: 500 }
        );
      }
    }

    if (!emailSent) {
      return NextResponse.json(
        { error: "No email address found for user", code: "NO_EMAIL" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Approval email sent successfully",
      data: {
        projectId,
        emailSent: true,
      },
    });
  }

  if (action === 'approve') {
    // Check the competition status to determine project status
    const projectStatus: string = 'live'; // Default to live if no competition
    // Approve the project - always go live immediately (competition logic removed)
    const shouldPublishNow = true;
    
    // Approve the project
    const updateData: Record<string, any> = {
      status: projectStatus,
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

    // Standard plan: grant dofollow if user verified our badge on their site.
    // Otherwise the project goes live with nofollow until they install/verify.
    if (project.plan === 'standard' && project.backlink_verified === true) {
      updateData.link_type = 'dofollow';
      updateData.dofollow_status = true;
      updateData.dofollow_reason = 'verified_badge';
      updateData.dofollow_awarded_at = new Date();
    }

    // If premium plan, set premium badge and dofollow status
    // BUT only if payment was completed - premium projects without payment should remain nofollow
    if (project.plan === 'premium' && project.payment_status === true) {
      updateData.premium_badge = true;
      updateData.dofollow_status = true;
      updateData.link_type = 'dofollow';
      updateData.dofollow_reason = 'premium_plan';
      updateData.dofollow_awarded_at = new Date();
      // Also ensure draft status is removed for paid premium projects
      if (project.is_draft === true || project.status === 'draft') {
        updateData.is_draft = false;
        if (updateData.status === 'draft' || !updateData.status) {
          updateData.status = projectStatus || 'pending';
        }
      }
    } else if (project.plan === 'premium' && project.payment_status !== true) {
      // Premium project without payment - check if there's a completed payment
      const payment = await db.findOne("payments", {
        $or: [
          { app_id: project.id, status: "completed" },
          { payment_id: project.order_id, status: "completed" }
        ]
      });
      
      if (payment) {
        // Payment exists but wasn't linked - fix it
        updateData.payment_status = true;
        updateData.is_draft = false;
        updateData.premium_badge = true;
        updateData.dofollow_status = true;
        updateData.link_type = 'dofollow';
        updateData.dofollow_reason = 'premium_plan';
        updateData.dofollow_awarded_at = new Date();
        if (project.status === 'draft') {
          updateData.status = projectStatus || 'pending';
        }
      } else {
        // CRITICAL: Premium project without payment - do NOT approve or schedule
        // Keep it as draft and do NOT apply premium perks
        console.warn("Attempted to approve premium project without payment - blocking:", {
          projectId: project.id,
          projectName: project.name,
          payment_status: project.payment_status,
        });
        
        // Reject the approval - premium projects require payment
        return NextResponse.json(
          { 
            error: "Premium projects require payment before approval. Please ensure payment is completed first.", 
            code: "PREMIUM_PAYMENT_REQUIRED",
            projectId: project.id,
          },
          { status: 400 }
        );
      }
    }

    const result = await db.updateOne(
      "apps",
      { id: projectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update project", code: "UPDATE_FAILED" },
        { status: 500 }
      );
    }

    // CRITICAL: Verify that premium perks (especially dofollow) were applied correctly
    if (project.plan === 'premium' && (project.payment_status === true || updateData.payment_status === true)) {
      const verifiedProject = await db.findOne("apps", { id: projectId });
      const needsDofollowFix = 
        verifiedProject.link_type !== "dofollow" ||
        verifiedProject.dofollow_status !== true ||
        verifiedProject.dofollow_reason !== "premium_plan";
      
      if (needsDofollowFix) {
        console.warn("Premium project missing dofollow after approval, fixing immediately:", {
          projectId: projectId,
          link_type: verifiedProject.link_type,
          dofollow_status: verifiedProject.dofollow_status,
        });
        
        await db.updateOne("apps", { id: projectId }, {
          $set: {
            link_type: "dofollow",
            dofollow_status: true,
            dofollow_reason: "premium_plan",
            premium_badge: true,
            dofollow_awarded_at: verifiedProject.dofollow_awarded_at || new Date(),
          },
        });
      }
    }

    // Send approval notification
    try {
      if (userEmail && user) {
        await notificationManager.sendSubmissionApprovalNotification({
          userId: user.id,
          userEmail: userEmail,
          project: {
            id: project.id,
            name: project.name,
            slug: project.slug
          },
          competition: null,
          projectStatus
        });
      }
    } catch (notificationError) {
      console.error("Failed to send approval notification:", notificationError);
      
      // Fallback to legacy email system
      try {
        if (userEmail) {
          await emailNotifications.projectApproved(userEmail, {
            projectName: project.name,
            slug: project.slug,
          });
        }
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
      }
    }

    // Trigger webhook for approved project
    try {
      await webhookEvents.projectApproved(project);
    } catch (webhookError) {
      console.error("Failed to trigger webhook:", webhookError);
    }

    return NextResponse.json({
      success: true,
      message: projectStatus === 'scheduled' 
        ? "Project approved and scheduled for launch" 
        : "Project approved and is now live",
      data: {
        projectId,
        status: projectStatus,
        emailSent: !!userEmail,
        scheduledForLaunch: projectStatus === 'scheduled',
      },
    });

  } else if (action === 'reject') {
    // Reject the project
    const updateData = {
      status: 'rejected',
      approved: false,
      rejection_reason: rejectionReason,
      // updated_at is handled by DB triggers
    };

    const result = await db.updateOne(
      "apps",
      { id: projectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update project", code: "UPDATE_FAILED" },
        { status: 500 }
      );
    }

    // Send rejection notification
    try {
      if (userEmail && user) {
        await notificationManager.sendSubmissionDeclineNotification({
          userId: user.id,
          userEmail: userEmail,
          project: {
            id: project.id,
            name: project.name,
            slug: project.slug
          },
          rejectionReason: rejectionReason
        });
      }
    } catch (notificationError) {
      console.error("Failed to send rejection notification:", notificationError);
      
      // Fallback to legacy email system
      try {
        if (userEmail) {
          await emailNotifications.projectRejected(userEmail, {
            projectName: project.name,
            rejectionReason: rejectionReason,
          });
        }
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }
    }

    // Trigger webhook for rejected project
    try {
      await webhookEvents.projectRejected(project, rejectionReason);
    } catch (webhookError) {
      console.error("Failed to trigger webhook:", webhookError);
    }

    return NextResponse.json({
      success: true,
      message: "Project rejected successfully",
      data: {
        projectId,
        status: 'rejected',
        rejectionReason,
        emailSent: !!userEmail,
      },
    });
  }
}

// Complete a weekly competition (mark as completed, no winner assignment)
async function completeCompetition(request) {
  const body = await request.json();
  const { competitionId } = body;

  if (!competitionId) {
    return NextResponse.json(
      { error: "competitionId is required (e.g., '2024-W01')" },
      { status: 400 }
    );
  }

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

  const now = new Date();
  await db.updateOne(
    "competitions",
    { id: competition.id },
    { $set: { status: "completed", completed_at: now } }
  );

  return NextResponse.json({
    success: true,
    message: `Competition ${competitionId} completed.`,
    competition: {
      id: competitionId,
      status: "completed",
    },
  });
}

// Get completable competitions (feature removed - returns empty)
async function getCompletableCompetitions() {
  return NextResponse.json({
    success: true,
    competitions: [],
    count: 0,
  });
}

// Get link type information
async function getLinkTypeInfo(searchParams) {
  const action = searchParams.get("action");
  const projectId = searchParams.get("projectId");

  // Get link type statistics
  if (action === "stats") {
    const stats = await getLinkTypeStats();
    return NextResponse.json({ success: true, stats });
  }

  // Get link type history for a project
  if (action === "history" && projectId) {
    const history = await getLinkTypeHistory(projectId);
    return NextResponse.json({ success: true, history });
  }

  return NextResponse.json({ error: "Invalid action or missing projectId" }, { status: 400 });
}

// Update link type for projects
async function updateLinkType(request, session) {
  const body = await request.json();
  const { action, projectId, linkType, projectIds } = body;

  if (!action) {
    return NextResponse.json({ error: "Action is required" }, { status: 400 });
  }

  let result;

  switch (action) {
    case "toggle":
      if (!projectId) {
        return NextResponse.json(
          { error: "projectId is required" },
          { status: 400 }
        );
      }
      result = await toggleLinkType(projectId, session.user.id);
      return NextResponse.json({
        success: true,
        message: `Link type changed to ${result.link_type}`,
        project: result,
      });

    case "upgrade":
      if (!projectId) {
        return NextResponse.json(
          { error: "projectId is required" },
          { status: 400 }
        );
      }
      result = await upgradeToDofollow(projectId, session.user.id);
      return NextResponse.json({
        success: true,
        message: "Upgraded to dofollow",
        project: result,
      });

    case "downgrade":
      if (!projectId) {
        return NextResponse.json(
          { error: "projectId is required" },
          { status: 400 }
        );
      }
      result = await downgradeToNofollow(projectId, session.user.id);
      return NextResponse.json({
        success: true,
        message: "Downgraded to nofollow",
        project: result,
      });

    case "bulk":
      if (!projectIds || !Array.isArray(projectIds)) {
        return NextResponse.json(
          { error: "projectIds array is required" },
          { status: 400 }
        );
      }
      if (!linkType || !["dofollow", "nofollow"].includes(linkType)) {
        return NextResponse.json(
          { error: "Valid linkType is required (dofollow or nofollow)" },
          { status: 400 }
        );
      }

      const updates = projectIds.map(id => ({
        projectId: id,
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

// Resend emails to users with projects in current launch
async function resendEmails(request) {
  try {
    const body = await request.json();
    const { type, competitionId } = body;

    if (!type || type !== 'current-launch') {
      return NextResponse.json(
        { error: "type is required and must be 'current-launch'" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const results = {
      timestamp: new Date().toISOString(),
      type,
      emailsSent: 0,
      errors: [],
    };

    if (type === 'current-launch') {
      // Resend launch reminders to users with projects in current active competition
      const now = new Date();
      
      let activeCompetition;
      if (competitionId) {
        activeCompetition = await db.findOne('competitions', { id: competitionId });
        if (!activeCompetition) {
          return NextResponse.json(
            { error: "Competition not found" },
            { status: 404 }
          );
        }
      } else {
        // Find the active competition
        activeCompetition = await db.findOne('competitions', {
          status: 'active',
          start_date: { $lte: now },
          end_date: { $gt: now },
        });
      }

      if (!activeCompetition) {
        return NextResponse.json(
          { error: "No active competition found" },
          { status: 404 }
        );
      }

      // Get all projects in this competition
      const projects = await db.find(
        'apps',
        {
          weekly_competition_id: activeCompetition.id,
          status: 'live',
        }
      );

      // Group projects by user
      const projectsByUser = new Map();
      for (const project of projects) {
        if (project.submitted_by) {
          if (!projectsByUser.has(project.submitted_by)) {
            projectsByUser.set(project.submitted_by, []);
          }
          projectsByUser.get(project.submitted_by).push(project);
        }
      }

      // Send launch reminders to each user
      for (const [userId, userProjects] of projectsByUser.entries()) {
        try {
          // Get user email from Supabase auth (source of truth for emails)
          const { data: authUserResult, error: authError } =
            await supabaseAdmin.auth.admin.getUserById(userId);

          if (authError) {
            console.error(
              `Failed to load auth user for ${userId}:`,
              authError
            );
            results.errors.push({
              userId: userId,
              error: `Failed to load user: ${authError.message}`,
            });
            continue;
          }

          const authUser = authUserResult?.user;
          const userEmail = authUser?.email;

          if (!userEmail) {
            results.errors.push({
              userId: userId,
              error: "User not found or has no email address",
            });
            continue;
          }

          // Send launch week reminder for each project
          for (const project of userProjects) {
            try {
              await notificationManager.sendLaunchWeekReminderNotification({
                userId: userId,
                userEmail: userEmail,
                project: project,
                competition: activeCompetition,
              });
              results.emailsSent++;
            } catch (reminderError) {
              console.error(`Failed to resend launch reminder for project ${project.name}:`, reminderError);
              results.errors.push({
                project: project.name,
                email: userEmail,
                error: reminderError.message,
              });
            }
          }
        } catch (userError) {
          console.error(`Error processing user ${userId} for launch reminders:`, userError);
          results.errors.push({
            userId: userId,
            error: userError.message,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Resent ${results.emailsSent} launch reminder email(s)`,
      results,
    });

  } catch (error) {
    console.error("Resend emails error:", error);
    return NextResponse.json(
      { error: "Failed to resend emails", details: error.message },
      { status: 500 }
    );
  }
}

// Fix premium projects in current launch - retroactively apply premium badges and dofollow links
async function fixPremiumProjects(request) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get("competition_id"); // Optional: specific competition, otherwise current active
    
    let competition;
    
    if (competitionId) {
      // Find by competition_id (e.g., "2026-W03")
      competition = await db.findOne("competitions", {
        competition_id: competitionId,
      });
    } else {
      // Find current active competition
      const now = new Date();
      competition = await db.findOne("competitions", {
        type: "weekly",
        status: "active",
        start_date: { $lte: now },
        end_date: { $gte: now },
      });
    }
    
    if (!competition) {
      return NextResponse.json(
        { error: "No active competition found. Specify competition_id or ensure there's an active competition." },
        { status: 404 }
      );
    }
    
    // Find all premium projects in this competition that are missing premium badges or dofollow links
    const premiumProjects = await db.find("apps", {
      weekly_competition_id: competition.id,
      plan: "premium",
      status: { $in: ["live", "scheduled"] }, // Include both live and scheduled
    });
    
    if (premiumProjects.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No premium projects found in this competition",
        fixed: 0,
        competition_id: competition.competition_id,
      });
    }
    
    const now = new Date();
    let fixedCount = 0;
    const fixedProjects = [];
    
    for (const project of premiumProjects) {
      const needsFix = 
        !project.premium_badge || 
        !project.dofollow_status || 
        project.link_type !== "dofollow";
      
      if (needsFix) {
        const updateData: Record<string, any> = {
          premium_badge: true,
          dofollow_status: true,
          link_type: "dofollow",
          dofollow_reason: "premium_plan",
        };
        
        // Only set dofollow_awarded_at if it's not already set
        if (!project.dofollow_awarded_at) {
          updateData.dofollow_awarded_at = now;
        }
        
        try {
          await db.updateOne(
            "apps",
            { id: project.id },
            { $set: updateData }
          );
          
          fixedCount++;
          fixedProjects.push({
            id: project.id,
            name: project.name,
            slug: project.slug,
            was_missing_badge: !project.premium_badge,
            was_missing_dofollow: !project.dofollow_status,
          });
        } catch (error) {
          console.error(`Failed to fix project ${project.name} (${project.id}):`, error);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} premium project(s)`,
      fixed: fixedCount,
      total_premium: premiumProjects.length,
      competition_id: competition.competition_id,
      fixed_projects: fixedProjects,
    });
    
  } catch (error) {
    console.error("Fix premium projects error:", error);
    return NextResponse.json(
      { error: "Failed to fix premium projects", details: error.message },
      { status: 500 }
    );
  }
}

// Fix premium projects that have completed payments but aren't marked as paid or missing launch_week
async function fixPaidProjects(request) {
  try {
    // Find all premium projects that have completed payments
    const allPremiumProjects = await db.find("apps", {
      plan: "premium",
    });

    const fixedProjects = [];
    const errors = [];

    for (const project of allPremiumProjects) {
      // Check if project has completed payments
      const completedPayments = await db.find("payments", {
        app_id: project.id,
        status: "completed",
      });

      if (completedPayments.length === 0) {
        continue; // Skip projects without completed payments
      }

      const needsFix = 
        !project.payment_status || 
        project.payment_status === false ||
        !project.launch_week ||
        project.launch_week === "" ||
        project.is_draft === true;

      if (needsFix) {
        const latestPayment = completedPayments.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        const updateData: Record<string, any> = {
          payment_status: true,
          is_draft: false,
        };

        // If missing launch_week, try to find the next available competition
        if (!project.launch_week || project.launch_week === "") {
          // Find upcoming or active competitions
          const now = new Date();
          const availableCompetition = await db.findOne("competitions", {
            type: "weekly",
            $or: [
              { status: "upcoming" },
              { 
                status: "active",
                start_date: { $lte: now },
                end_date: { $gte: now },
              },
            ],
          }, {
            sort: { start_date: 1 }, // Get the earliest upcoming/active competition
          });

          if (availableCompetition) {
            updateData.launch_week = availableCompetition.competition_id;
            updateData.weekly_competition_id = availableCompetition.id;
          }
        }

        // Set premium perks
        updateData.premium_badge = true;
        updateData.dofollow_status = true;
        updateData.link_type = "dofollow";
        updateData.dofollow_reason = "premium_plan";
        if (!project.dofollow_awarded_at) {
          updateData.dofollow_awarded_at = new Date();
        }

        // Set scheduled_launch if not set
        if (!project.scheduled_launch) {
          updateData.scheduled_launch = true;
        }

        // Set status to pending if it's draft
        if (project.status === "draft" || !project.status) {
          updateData.status = "pending";
        }

        // Set payment_date from latest payment
        if (latestPayment.created_at) {
          updateData.payment_date = new Date(latestPayment.created_at);
        }

        // Set order_id if not set and payment has payment_id
        if (!project.order_id && latestPayment.payment_id) {
          updateData.order_id = latestPayment.payment_id;
        }

        try {
          await db.updateOne(
            "apps",
            { id: project.id },
            { $set: updateData }
          );

          fixedProjects.push({
            id: project.id,
            name: project.name,
            slug: project.slug,
            was_missing_payment_status: !project.payment_status || project.payment_status === false,
            was_missing_launch_week: !project.launch_week || project.launch_week === "",
            was_draft: project.is_draft === true,
            launch_week_assigned: updateData.launch_week || project.launch_week,
            payment_count: completedPayments.length,
          });
        } catch (error) {
          console.error(`Failed to fix project ${project.name} (${project.id}):`, error);
          errors.push({
            projectId: project.id,
            projectName: project.name,
            error: error.message,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedProjects.length} paid project(s)`,
      fixed: fixedProjects.length,
      total_checked: allPremiumProjects.length,
      fixed_projects: fixedProjects,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("Fix paid projects error:", error);
    return NextResponse.json(
      { error: "Failed to fix paid projects", details: error.message },
      { status: 500 }
    );
  }
}

// Check Stripe sessions for projects with checkout_session_id but payment_status = false
// This handles cases where webhook didn't process payments correctly
async function checkStripeSessions(request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id"); // Optional: specific project
    
    // Find projects with checkout_session_id but payment_status = false
    const query: Record<string, any> = {
      plan: "premium",
      payment_status: false,
      checkout_session_id: { $exists: true, $ne: null },
    };

    if (projectId) {
      query.id = projectId;
    }
    
    const projects = await db.find("apps", query, {
      limit: projectId ? 1 : 50, // Limit to 50 if not specific project
    });
    
    if (projects.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No projects found with checkout_session_id and payment_status = false",
        checked: 0,
        processed: 0,
      });
    }
    
    let checkedCount = 0;
    let processedCount = 0;
    const processedProjects = [];
    const errors = [];
    
    for (const project of projects) {
      try {
        checkedCount++;
        
        // Verify Polar checkout status
        const sessionCheck = await verifyStripeSession(project.checkout_session_id);
        const checkout = sessionCheck.session as Record<string, any>;

        if (sessionCheck.success) {
          // Polar reports a confirmed/succeeded checkout — apply the same
          // outcome the webhook would have applied for a `premium_submission`
          // order. We deliberately don't re-set per-tier perks here (badges,
          // dofollow links) — those are managed elsewhere by admin tooling.
          const paymentId =
            (checkout.orderId as string | undefined) ||
            (checkout.id as string) ||
            project.checkout_session_id;
          const metadata = (sessionCheck.metadata as Record<string, string>) || {};
          const customerEmail = checkout?.customer?.email as string | undefined;
          const amount = (checkout.totalAmount as number | undefined) ?? 1500;
          const currency = (checkout.currency as string | undefined) ?? "usd";

          await db.updateOne(
            "apps",
            { id: project.id },
            {
              $set: {
                plan: "premium",
                payment_status: true,
                payment_date: new Date(),
                order_id: paymentId,
                is_draft: false,
                status: project.status === "draft" ? "pending" : project.status,
                upgrade_pending: false,
                updated_at: new Date(),
              },
            }
          );

          // Idempotency on the payment record.
          const existingPayment = await db.findOne("payments", {
            $or: [
              { app_id: project.id, status: "completed" },
              { invoice_id: project.checkout_session_id, status: "completed" },
              { payment_id: paymentId, status: "completed" },
            ],
          });

          if (!existingPayment) {
            await db.insertOne("payments", {
              user_id: project.submitted_by,
              app_id: project.id,
              plan: "premium",
              amount,
              currency,
              payment_id: paymentId,
              invoice_id: project.checkout_session_id,
              status: "completed",
              metadata: {
                provider: "polar",
                checkoutId: project.checkout_session_id,
                customerEmail,
                rawMetadata: metadata,
                processedBy: "check-stripe-sessions",
              },
              paid_at: new Date(),
            });
          }

          processedCount++;
          processedProjects.push({
            id: project.id,
            name: project.name,
            slug: project.slug,
            sessionId: project.checkout_session_id,
          });
        }
      } catch (error) {
        console.error(`Error checking session for project ${project.id}:`, error);
        errors.push({
          projectId: project.id,
          projectName: project.name,
          error: error.message,
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Checked ${checkedCount} project(s), processed ${processedCount} payment(s)`,
      checked: checkedCount,
      processed: processedCount,
      processed_projects: processedProjects,
      errors: errors.length > 0 ? errors : undefined,
    });
    
  } catch (error) {
    console.error("Check Stripe sessions error:", error);
    return NextResponse.json(
      { error: "Failed to check Stripe sessions", details: error.message },
      { status: 500 }
    );
  }
}
