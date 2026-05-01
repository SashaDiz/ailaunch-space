import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { db } from '@/lib/supabase/database';
import { getSession } from '@/lib/supabase/auth';
import { notificationManager } from '@/lib/notifications';

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
    if ('error' in authCheck) return authCheck.error;

    const { searchParams } = new URL(request.url);
    let type = searchParams.get("type");

    // Handle malformed URLs like "type=projects:1" by extracting just "projects"
    if (type && type.includes(":")) {
      type = type.split(":")[0];
    }

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
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Helper functions
async function getUserProjects(session, searchParams) {
  try {
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50"); // Increased default limit
    const status = searchParams.get("status");
    
    const filter: Record<string, any> = { submitted_by: session.user.id };
    
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
      try {
        let statusBadge = "live"; // Default badge
        let canVote = false;
      
      // Check if there's a completed payment for this project
      // This handles cases where payment_status might be false but payment was actually completed
      // This is a fallback in case the webhook didn't run or failed
      // Also handles cases where payment_status is true but project is still a draft or missing dofollow links
      let hasPayment = project.payment_status === true;
      let needsFixing = false;
      
      // CRITICAL: Also check by checkout_session_id if project has one
      // This handles cases where webhook hasn't processed yet but payment exists
      // Also verify with Stripe API if payment was actually completed
      if (!hasPayment && project.checkout_session_id && project.plan === "premium") {
        // First check database for existing payment record
        const paymentByCheckout = await db.findOne("payments", {
          invoice_id: project.checkout_session_id,
          status: "completed",
        });
        
        if (paymentByCheckout) {
          hasPayment = true;
          // Link payment to project if not already linked
          if (!paymentByCheckout.app_id) {
            await db.updateOne("payments", { id: paymentByCheckout.id }, {
              $set: { app_id: project.id }
            });
          }
        } else {
          // No payment record found — verify with the payment provider.
          // Handles cases where the webhook failed but payment actually completed.
          try {
            const { verifyStripeSession } = await import("@/lib/payments/polar");
            const sessionCheck = await verifyStripeSession(project.checkout_session_id);
            const checkout = sessionCheck.session as Record<string, any>;

            if (sessionCheck.success) {
              const paymentId =
                (checkout.orderId as string | undefined) ||
                (checkout.id as string) ||
                project.checkout_session_id;
              const sessionMetadata = (sessionCheck.metadata as Record<string, string>) || {};
              const customerEmail = checkout?.customer?.email as string | undefined;
              const amount = (checkout.totalAmount as number | undefined) ?? 1500;
              const currency = (checkout.currency as string | undefined) ?? "usd";

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
                  rawMetadata: sessionMetadata,
                  processedBy: "user_api_fallback",
                },
                paid_at: new Date(),
              });

              hasPayment = true;
              // Mark that the project record itself still needs reconciliation.
              needsFixing = true;
            }
          } catch (verifyError) {
            console.warn("Failed to verify Polar checkout:", {
              projectId: project.id,
              checkoutSessionId: project.checkout_session_id,
              error: verifyError.message,
            });
            // Don't fail - continue without verification.
          }
        }
      }
      
      // Check if project needs fixing even if payment_status is true
      // This happens when webhook partially succeeded or there was a bug
      needsFixing = needsFixing || (project.payment_status === true && project.plan === "premium" && (
        project.is_draft === true ||
        project.status === "draft" ||
        project.link_type !== "dofollow" ||
        project.dofollow_status !== true
      ));
      
      if (!hasPayment && project.plan === "premium") {
        // Try multiple methods to find payment:
        // 1. By app_id (direct link)
        let payment = await db.findOne("payments", {
          app_id: project.id,
          status: "completed",
        });
        
        // 2. By checkout_session_id (CRITICAL for projects created with checkout)
        if (!payment && project.checkout_session_id) {
          payment = await db.findOne("payments", {
            invoice_id: project.checkout_session_id,
            status: "completed",
          });
          
          if (!payment) {
            // Also check by payment_id
            payment = await db.findOne("payments", {
              payment_id: project.checkout_session_id,
              status: "completed",
            });
          }
          
        }
        
        // 3. By order_id matching project's order_id
        if (!payment && project.order_id) {
          payment = await db.findOne("payments", {
            payment_id: project.order_id,
            status: "completed",
          });
        }
        
        // 4. By user and plan (for cases where app_id is null)
        if (!payment && session.user.id) {
          const userPayments = await db.find("payments", {
            user_id: session.user.id,
            plan: "premium",
            status: "completed",
            app_id: null, // Only check unlinked payments
          }, {
            sort: { paid_at: -1 },
            limit: 1,
          });
          
          // If we found an unlinked payment and this is the most recent premium draft, link it
          if (userPayments.length > 0 && project.is_draft === true) {
            payment = userPayments[0];
            // Link the payment to this project
            await db.updateOne("payments", { id: payment.id }, {
              $set: { app_id: project.id }
            });
          }
        }
        
        hasPayment = !!payment;
      }
      
      // If payment exists but project needs fixing (either payment_status is false or project is still a draft/missing dofollow)
      if ((hasPayment && !project.payment_status) || needsFixing) {
        const updateData: Record<string, any> = {
          payment_status: true,
          is_draft: false,
          scheduled_launch: true,
          status: project.status === "draft" ? "pending" : project.status,
          updated_at: new Date(),
        };

        // Apply pending launch info if it exists (mirror webhook behavior)
        if (project.pending_weekly_competition_id && !project.weekly_competition_id) {
          updateData.weekly_competition_id = project.pending_weekly_competition_id;
          updateData.entered_weekly = true;
        }
        
        if (project.pending_launch_week && !project.launch_week) {
          updateData.launch_week = project.pending_launch_week;
        }
        
        if (project.pending_launch_date && !project.launch_date) {
          updateData.launch_date = project.pending_launch_date;
        }
        
        if (project.pending_launch_month && !project.launch_month) {
          updateData.launch_month = project.pending_launch_month;
        }

        // Apply premium perks ONLY if payment was confirmed
        // CRITICAL: Never apply premium perks without payment verification
        if (project.plan === "premium" && hasPayment) {
          // Always ensure these are set for premium plans with payment
          updateData.premium_badge = true;
          updateData.skip_queue = true;
          updateData.social_promotion = true;
          
          // Always ensure dofollow links are set for premium plans - THIS IS CRITICAL
          updateData.link_type = "dofollow";
          updateData.dofollow_status = true;
          updateData.dofollow_reason = "premium_plan";
          if (!project.dofollow_awarded_at) {
            updateData.dofollow_awarded_at = new Date();
          }
          
          if (typeof project.guaranteed_backlinks !== "number") {
            updateData.guaranteed_backlinks = 3;
          }
          
          // Ensure status is not "draft" for paid premium projects
          if (updateData.status === "draft" || project.status === "draft") {
            updateData.status = "pending"; // Will be set to "scheduled" or "live" by admin/competition logic
          }
        } else if (project.plan === "premium" && !hasPayment) {
          // Premium project without payment - ensure it remains a draft
          // Do NOT apply premium perks or schedule launch
          console.warn("Premium project without payment detected - keeping as draft:", {
            projectId: project.id,
            projectName: project.name,
            hasPayment: false,
            payment_status: project.payment_status,
          });
          
          // Ensure project remains as draft and no premium perks are applied
          updateData.is_draft = true;
          updateData.scheduled_launch = false;
          updateData.status = "draft";
          // Explicitly do NOT set premium_badge, skip_queue, social_promotion, or dofollow
        }

        // Build update operation
        const updateOperation: Record<string, any> = { $set: updateData };
        
        // Clear pending fields if they were applied
        const hasPendingFields = project.pending_launch_week || project.pending_weekly_competition_id;
        if (hasPendingFields) {
          updateOperation.$unset = {
            pending_launch_week: "",
            pending_launch_date: "",
            pending_weekly_competition_id: "",
            pending_launch_month: "",
          };
        }

        await db.updateOne(
          "apps",
          { id: project.id },
          updateOperation
        );
        
        // CRITICAL: Verify premium perks were applied correctly, especially dofollow
        // Only verify if payment was confirmed
        if (project.plan === "premium" && hasPayment && project.payment_status === true) {
          const verifiedProject = await db.findOne("apps", { id: project.id });
          const needsDofollowFix = 
            verifiedProject.link_type !== "dofollow" ||
            verifiedProject.dofollow_status !== true ||
            verifiedProject.dofollow_reason !== "premium_plan";
          
          if (needsDofollowFix) {
            console.warn("Premium project missing dofollow, fixing immediately:", {
              projectId: project.id,
              link_type: verifiedProject.link_type,
              dofollow_status: verifiedProject.dofollow_status,
            });
            
            await db.updateOne("apps", { id: project.id }, {
              $set: {
                link_type: "dofollow",
                dofollow_status: true,
                dofollow_reason: "premium_plan",
                premium_badge: true,
                dofollow_awarded_at: verifiedProject.dofollow_awarded_at || new Date(),
              },
            });
            
            // Refresh project after fix
            const fixedProject = await db.findOne("apps", { id: project.id });
            project = fixedProject;
          } else {
            project = verifiedProject;
          }
        }
        
        // Update local project object to reflect changes
        project.payment_status = true;
        project.is_draft = false;
        if (updateData.weekly_competition_id) project.weekly_competition_id = updateData.weekly_competition_id;
        if (updateData.launch_week) project.launch_week = updateData.launch_week;
        if (updateData.launch_date) project.launch_date = updateData.launch_date;
        if (updateData.launch_month) project.launch_month = updateData.launch_month;
        if (updateData.premium_badge) project.premium_badge = true;
        if (updateData.dofollow_status) {
          project.dofollow_status = true;
          project.link_type = "dofollow";
        }
        
        // Update hasPayment to true after fixing
        hasPayment = true;
      }
      
      // Check if project is a draft or premium without payment - should show as draft
      const isDraft = project.is_draft === true || project.status === "draft";
      const isPremiumUnpaid = project.plan === "premium" && !hasPayment;
      
      if (isDraft || isPremiumUnpaid) {
        statusBadge = "draft";
        canVote = false;
      } else if (project.weekly_competition_id) {
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
      } catch (projectError) {
        console.error(`Error processing project ${project.id}:`, projectError);
        // Return project with default values if processing fails
        return {
          ...project,
          statusBadge: "live",
          canVote: false,
        };
      }
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
  } catch (error) {
    console.error("Error in getUserProjects:", error);
    console.error("Error stack:", error.stack);
    throw error; // Re-throw to be caught by outer try-catch
  }
}

async function getUserStats(session, searchParams) {
  const userId = session.user.id;

  // Get user's projects for calculations
  const projects = await db.find("apps", { submitted_by: userId });

  // Calculate stats
  const totalProjects = projects.length;
  const totalVotesReceived = projects.reduce(
    (sum, project) => sum + (project.upvotes || 0),
    0
  );
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
      totalSubmissions: totalProjects,
      approvedSubmissions: liveProjects,
    },
  });
}

async function getUserProfile(session) {
  const userId = session.user.id;

  // Get user profile data from database
  let userProfile = await db.findOne("users", { id: userId });
  
  // If user exists, update avatar_url from Google OAuth if available
  // Only update if current avatar_url is empty/null (preserves custom uploaded avatars)
  if (userProfile) {
    const googleAvatarUrl = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
    if (googleAvatarUrl && (!userProfile.avatar_url || userProfile.avatar_url === '')) {
      await db.updateOne("users", { id: userId }, {
        $set: {
          avatar_url: googleAvatarUrl,
          updated_at: new Date()
        }
      });
      userProfile.avatar_url = googleAvatarUrl;
    }
  }
  
  // If user profile doesn't exist, create it
  if (!userProfile) {
    // Create a new user profile with basic information
    const newUserProfile = {
      id: userId,
      full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
      first_name: session.user.user_metadata?.first_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
      avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
      role: 'user',
      total_submissions: 0,
      reputation: 0,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      last_login_at: new Date()
    };

    try {
      // Insert the new user profile
      await db.insertOne("users", newUserProfile);
      userProfile = newUserProfile;
    } catch (error) {
      console.error("Failed to create user profile:", error);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }
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
    if ('error' in authCheck) return authCheck.error;

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

    // Get current user data to preserve avatar_url if not being updated
    const currentUser = await db.findOne("users", { id: userId });
    
    // Prepare update data
    const updateData: Record<string, any> = {
      full_name: full_name.trim(),
      bio: bio?.trim() || null,
      twitter: twitter?.trim() || null,
      website: website?.trim() || null,
      github: github?.trim() || null,
      linkedin: linkedin?.trim() || null,
      location: location?.trim() || null,
      updated_at: new Date().toISOString()
    };

    // Only include avatar_url in update if it's being explicitly updated
    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url?.trim() || null;
    } else {
      // Preserve existing avatar_url
      updateData.avatar_url = currentUser?.avatar_url;
    }

    // Update user in database
    const result = await db.updateOne("users", { id: userId }, { $set: updateData });
    
    if (!result || result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Prepare response data - only include avatar_url if it was updated
    const responseData: Record<string, any> = {
      full_name: updateData.full_name,
      bio: updateData.bio,
      twitter: updateData.twitter,
      website: updateData.website,
      github: updateData.github,
      linkedin: updateData.linkedin,
      location: updateData.location,
      updated_at: updateData.updated_at
    };

    // Only include avatar_url in response if it was explicitly updated
    if (avatar_url !== undefined) {
      responseData.avatar_url = updateData.avatar_url;
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: responseData
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
    if ('error' in authCheck) return authCheck.error;

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