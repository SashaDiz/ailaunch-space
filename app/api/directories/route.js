import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "../../libs/supabase.js";
import { db } from "../../libs/database.js";
import { webhookEvents } from "../../libs/webhooks.js";
// import { DirectorySubmissionSchema } from "../../libs/models/schemas";

// GET /api/directories - Get directories with filtering and sorting
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check for duplicate website URL or slug (special endpoint)
    const checkDuplicate = searchParams.get("check_duplicate");
    if (checkDuplicate) {
      const websiteUrl = searchParams.get("website_url");
      const slug = searchParams.get("slug");
      
      // Check for slug duplicate
      if (slug) {
        const existingSlug = await db.findOne("apps", { slug });
        
        if (existingSlug) {
          return NextResponse.json({
            exists: true,
            existing_directory: existingSlug.name,
          });
        }
        
        return NextResponse.json({
          exists: false,
        });
      }
      
      // Check for website URL duplicate
      if (!websiteUrl) {
        return NextResponse.json(
          { error: "website_url or slug parameter is required" },
          { status: 400 }
        );
      }
      
      // Normalize website URL for duplicate checking
      const normalizeUrl = (url) => {
        try {
          const urlObj = new URL(url);
          // Remove www prefix and convert hostname to lowercase
          let hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();
          // Normalize pathname (remove trailing slash, keep as-is otherwise)
          let pathname = urlObj.pathname === '/' ? '' : urlObj.pathname.replace(/\/$/, '');
          // Return normalized URL
          return hostname + pathname;
        } catch (e) {
          // If URL is invalid, return as-is for now
          return url.toLowerCase().replace(/^www\./, '').replace(/\/$/, '');
        }
      };
      
      const normalizedWebsiteUrl = normalizeUrl(websiteUrl);
      
      // Check if website URL already exists
      // First try exact match
      let duplicateWebsite = await db.findOne("apps", { website_url: websiteUrl });
      
      if (!duplicateWebsite) {
        // If no exact match, check for normalized matches
        const allApps = await db.find("apps", {}, { projection: 'website_url,name' });
        duplicateWebsite = allApps.find(app => 
          normalizeUrl(app.website_url) === normalizedWebsiteUrl
        );
      }
      
      if (duplicateWebsite) {
        return NextResponse.json({
          exists: true,
          existing_directory: duplicateWebsite.name,
        });
      }
      
      return NextResponse.json({
        exists: false,
      });
    }
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const pricing = searchParams.get("pricing");
    const competition = searchParams.get("competition"); // 'weekly'
    const status = searchParams.get("status") || "live";
    const sort = searchParams.get("sort") || "upvotes"; // 'upvotes', 'recent', 'views'
    const search = searchParams.get("search");

    // Build query filter
    const filter = { status };
    
    if (category && category !== "all") {
      // Try to find the category by slug first, then by name
      const categoryDoc = await db.findOne("categories", {
        $or: [
          { slug: category },
          { name: category }
        ]
      });
      
      if (categoryDoc) {
        // Use both slug and name for backward compatibility
        filter.categories = { 
          $in: [categoryDoc.slug, categoryDoc.name] 
        };
      } else {
        // Fallback to original category filter
        filter.categories = { $in: [category] };
      }
    }

    // Handle search filter
    if (search) {
      // Escape special regex characters to prevent ReDoS attacks
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const safeSearch = escapeRegex(search.trim());
      
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: { $regex: safeSearch, $options: "i" } },
          { short_description: { $regex: safeSearch, $options: "i" } },
          { categories: { $regex: safeSearch, $options: "i" } },
        ]
      });
    }

    // Handle pricing filter
    if (pricing && pricing !== "all") {
      filter.$and = filter.$and || [];
      switch (pricing) {
        case "free":
          filter.$and.push({
            $or: [
              { pricing: { $regex: /free/i } },
              { pricing: { $exists: false } },
              { pricing: "" }
            ]
          });
          break;
        case "freemium":
          filter.$and.push({
            pricing: { $regex: /freemium/i }
          });
          break;
        case "paid":
          filter.$and.push({
            $and: [
              { pricing: { $exists: true } },
              { pricing: { $ne: "" } },
              { pricing: { $not: { $regex: /free/i } } },
              { pricing: { $not: { $regex: /^freemium$/i } } }
            ]
          });
          break;
      }
    }

    // Add competition filter if specified
    if (competition === "weekly") {
      // Show only directories from active weekly competitions
      // Get current active weekly competition
      const activeWeekly = await db.findOne("competitions", {
        type: "weekly",
        status: "active"
      });
      
      if (activeWeekly) {
        filter.weekly_competition_id = activeWeekly.id; // UUID reference
        filter.entered_weekly = true;
      } else {
        // No active weekly competition, return empty results immediately
        return NextResponse.json({
          success: true,
          data: {
            directories: [],
            pagination: {
              page,
              limit,
              totalCount: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
            filters: {
              category,
              pricing,
              competition,
              status,
              sort,
              search,
            },
          },
        });
      }
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case "upvotes":
        sortOptions = { upvotes: -1, created_at: -1 };
        break;
      case "recent":
        sortOptions = { created_at: -1 };
        break;
      case "views":
        sortOptions = { views: -1, upvotes: -1 };
        break;
      default:
        sortOptions = { upvotes: -1, created_at: -1 };
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await db.count("apps", filter);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch directories
    const directories = await db.find(
      "apps", 
      filter,
      {
        sort: sortOptions,
        limit,
        skip,
      }
    );

    // Get user's votes if authenticated
    let userVotes = {};
    
    // Check user session properly with cookie-based auth
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
    
    if (user?.id && directories.length > 0) {
      const appIds = directories.map(dir => dir.id);
      const votes = await db.find("votes", {
        user_id: user.id,
        app_id: { $in: appIds },
      });
      
      userVotes = votes.reduce((acc, vote) => {
        acc[vote.app_id] = true;
        return acc;
      }, {});
    }

    // Add userVoted field to each directory
    const directoriesWithVotes = directories.map(dir => ({
      ...dir,
      userVoted: userVotes[dir.id] || false,
    }));

    return NextResponse.json({
      success: true,
      data: {
        directories: directoriesWithVotes,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        filters: {
          category,
          pricing,
          competition,
          status,
          sort,
          search,
        },
      },
    });

  } catch (error) {
    console.error("Directories API error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      url: request.url
    });
    return NextResponse.json(
      { 
        error: "Internal server error", 
        code: "INTERNAL_ERROR",
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : error.message
      },
      { status: 500 }
    );
  }
}

// POST /api/directories - Create a new directory (submission)
export async function POST(request) {
  try {
    // Check authentication with proper cookie-based session
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name, options) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Use getUser() instead of getSession() for security
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    
    // Get all Supabase cookies for debugging
    const allCookies = Array.from(cookieStore.getAll());
    const sbCookies = allCookies.filter(c => c.name.includes('sb'));
    
    // Debug logging
    console.log('POST /api/directories - Session check:', {
      hasSession: !!user,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      sessionError: sessionError?.message,
      cookiesPresent: {
        count: sbCookies.length,
        names: sbCookies.map(c => c.name),
        values: sbCookies.map(c => ({ name: c.name, valueLength: c.value?.length || 0, hasValue: !!c.value })),
      }
    });
    
    if (!user?.id) {
      console.error('Authentication failed - no user ID:', {
        hasSession: !!user,
        sessionError: sessionError?.message,
        cookieCount: sbCookies.length
      });
      return NextResponse.json(
        { 
          error: "Authentication required. Please sign in to submit your AI project.", 
          code: "UNAUTHORIZED",
          message: "You must be logged in to submit AI projects to our launches."
        },
        { status: 401 }
      );
    }
    
    console.log('Directories API - User authenticated successfully:', {
      userId: user.id,
      email: user.email
    });

    const body = await request.json();
    
    console.log('Directory submission - Request body:', {
      plan: body.plan,
      launch_week: body.launch_week,
      name: body.name,
      hasWebsiteUrl: !!body.website_url,
      hasContactEmail: !!body.contact_email,
      categoriesCount: body.categories?.length
    });
    
    // Basic validation
    const requiredFields = ["name", "short_description", "website_url", "categories", "contact_email", "plan", "launch_week"];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(", ")}`, 
          code: "MISSING_FIELDS",
          fields: missingFields,
        },
        { status: 400 }
      );
    }

    // Validate URL formats
    try {
      new URL(body.website_url);
    } catch (e) {
      console.error('Invalid website URL format:', body.website_url);
      return NextResponse.json(
        { 
          error: "Please enter a valid website URL (e.g., https://example.com)", 
          code: "INVALID_URL",
          fields: ["website_url"],
        },
        { status: 400 }
      );
    }

    // Validate logo URL (required)
    if (!body.logo_url) {
      return NextResponse.json(
        { 
          error: "Logo URL is required", 
          code: "MISSING_LOGO",
          fields: ["logo_url"],
        },
        { status: 400 }
      );
    }

    try {
      new URL(body.logo_url);
    } catch (e) {
      console.error('Invalid logo URL format:', body.logo_url);
      return NextResponse.json(
        { 
          error: "Please enter a valid logo URL", 
          code: "INVALID_LOGO_URL",
          fields: ["logo_url"],
        },
        { status: 400 }
      );
    }

    // Validate optional video URL
    if (body.video_url && body.video_url.trim() !== "") {
      try {
        new URL(body.video_url);
      } catch (e) {
        console.error('Invalid video URL format:', body.video_url);
        return NextResponse.json(
          { 
            error: "Please enter a valid video URL or leave it empty", 
            code: "INVALID_VIDEO_URL",
            fields: ["video_url"],
          },
          { status: 400 }
        );
      }
    }

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug already exists
    const existingApp = await db.findOne("apps", { slug });
    if (existingApp) {
      // Allow resubmission if it's the user's own draft or unpaid premium submission
      // This handles the case where payment failed and user wants to try again
      if ((existingApp.is_draft || 
           (existingApp.plan === "premium" && existingApp.payment_status === false)) && 
          existingApp.submitted_by === user.id) {
        console.log('Found existing draft or unpaid premium submission - will update it:', {
          id: existingApp.id,
          slug: existingApp.slug,
          isDraft: existingApp.is_draft
        });
        
        // Return the existing draft ID so we can update it instead of creating new
        // This will be handled in the directory creation logic below
      } else {
        console.error('Slug already exists:', slug);
        return NextResponse.json(
          { error: "An AI project with this name already exists", code: "SLUG_EXISTS" },
          { status: 400 }
        );
      }
    }

    // Normalize website URL for duplicate checking
    const normalizeUrl = (url) => {
      try {
        const urlObj = new URL(url);
        // Remove www prefix and convert hostname to lowercase
        let hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();
        // Normalize pathname (remove trailing slash, keep as-is otherwise)
        let pathname = urlObj.pathname === '/' ? '' : urlObj.pathname.replace(/\/$/, '');
        // Return normalized URL
        return hostname + pathname;
      } catch (e) {
        // If URL is invalid, return as-is for now (will be caught by validation)
        return url.toLowerCase().replace(/^www\./, '').replace(/\/$/, '');
      }
    };

    const normalizedWebsiteUrl = normalizeUrl(body.website_url);

    // Check if website URL already exists (more efficient approach)
    // First try exact match
    let duplicateWebsite = await db.findOne("apps", { website_url: body.website_url });
    
    if (!duplicateWebsite) {
      // If no exact match, check for normalized matches
      const allApps = await db.find("apps", {}, { projection: 'id,website_url,name,plan,payment_status,submitted_by' });
      duplicateWebsite = allApps.find(app => 
        normalizeUrl(app.website_url) === normalizedWebsiteUrl
      );
    }
    
    if (duplicateWebsite) {
      // Allow resubmission if it's the user's own draft or unpaid premium submission
      if ((duplicateWebsite.is_draft || 
           (duplicateWebsite.plan === "premium" && duplicateWebsite.payment_status === false)) && 
          duplicateWebsite.submitted_by === user.id) {
        console.log('Found existing draft or unpaid premium submission by URL - will update it:', {
          id: duplicateWebsite.id,
          website_url: duplicateWebsite.website_url,
          isDraft: duplicateWebsite.is_draft
        });
        
        // Will be handled in the directory creation logic below
      } else {
        return NextResponse.json(
          { 
            error: `This website (${body.website_url}) has already been submitted as "${duplicateWebsite.name}"`, 
            code: "WEBSITE_EXISTS",
            existing_directory: duplicateWebsite.name,
          },
          { status: 400 }
        );
      }
    }

    // Get selected weekly competition
    const selectedWeeklyCompetition = await db.findOne("competitions", {
      competition_id: body.launch_week,
      type: "weekly",
    });
    
    console.log('Competition lookup:', {
      requestedWeek: body.launch_week,
      found: !!selectedWeeklyCompetition,
      competitionId: selectedWeeklyCompetition?.competition_id
    });
    
    if (!selectedWeeklyCompetition) {
      console.error('Selected launch week not found:', body.launch_week);
      return NextResponse.json(
        { error: "Selected launch week not found", code: "INVALID_WEEK" },
        { status: 400 }
      );
    }
    
    // Check slot availability based on plan
    // New slot system:
    // - Standard and Premium SHARE the first 15 slots
    // - Premium gets 10 EXTRA slots (total 25 slots for premium)
    const totalUsed = selectedWeeklyCompetition.total_submissions || 0;
    
    console.log('Slot availability check:', {
      plan: body.plan,
      totalUsed,
      maxSlots: body.plan === "premium" ? 25 : 15
    });
    
    if (body.plan === "premium") {
      // Premium can submit if total submissions < 25 (15 shared + 10 extra)
      if (totalUsed >= 25) {
        console.error('Week full for premium:', { totalUsed });
        return NextResponse.json(
          { error: "Selected launch week is full (all 25 slots taken)", code: "WEEK_FULL" },
          { status: 400 }
        );
      }
    } else {
      // Standard can only submit if total submissions < 15 (shared slots only)
      if (totalUsed >= 15) {
        console.error('Week full for standard:', { totalUsed });
        return NextResponse.json(
          { error: "Selected launch week is full for standard submissions (15 slots taken). Upgrade to Premium to access 10 additional slots.", code: "WEEK_FULL" },
          { status: 400 }
        );
      }
    }
    
    // Calculate launch month for tracking purposes
    const launchDate = new Date(selectedWeeklyCompetition.start_date);
    const launchYear = launchDate.getFullYear();
    const launchMonth = String(launchDate.getMonth() + 1).padStart(2, "0");
    const monthlyCompetitionId = `${launchYear}-${launchMonth}`;

    // Calculate current week and month IDs
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    
    const startOfYear = new Date(currentYear, 0, 1);
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    const currentWeek = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const weekString = String(currentWeek).padStart(2, "0");

    // Set plan pricing and features
    const planConfig = {
      standard: {
        price: 0,
        homepage_duration: 7, // 7 days on homepage
        guaranteed_backlinks: 0, // Can earn dofollow via weekly competition (top 3)
        premium_badge: false,
        skip_queue: false,
        social_promotion: false,
        max_slots: 15, // 15 slots per week
      },
      premium: {
        price: 15,
        homepage_duration: 7, // 7 days (can be extended by admin)
        guaranteed_backlinks: 3, // Plus dofollow external backlink by default
        premium_badge: true,
        skip_queue: true,
        social_promotion: true,
        max_slots: 10, // 10 dedicated slots per week
      },
    };

    const planDetails = planConfig[body.plan] || planConfig.standard;

    // Check if we're updating an existing draft
    const existingDraft = existingApp || duplicateWebsite;
    const isUpdatingDraft = existingDraft && 
                           (existingDraft.is_draft || 
                            (existingDraft.plan === "premium" && existingDraft.payment_status === false)) &&
                           existingDraft.submitted_by === user.id;

    // Create directory object
    const directoryData = {
      // Basic info
      name: body.name,
      slug,
      short_description: body.short_description,
      full_description: body.full_description || body.short_description,
      website_url: body.website_url,
      logo_url: body.logo_url,
      screenshots: body.screenshots || [],
      video_url: body.video_url || "",
      
      // Categorization
      categories: body.categories,
      pricing: body.pricing || "Free",
      tags: body.tags || [],
      
      // Launch information
      launch_week: body.launch_week,
      launch_month: monthlyCompetitionId,
      launch_date: selectedWeeklyCompetition.start_date,
      // For premium plans, don't schedule until payment is confirmed
      // For standard plans, schedule immediately (it's free)
      scheduled_launch: body.plan === "standard",
      
      // Contact and ownership
      contact_email: body.contact_email,
      submitted_by: user.id,
      maker_name: body.maker_name || user.name,
      maker_twitter: body.maker_twitter || "",
      
      // Plan details
      plan: body.plan,
      plan_price: planDetails.price,
      // For premium plans, use main website URL if no specific backlink URL is provided
      backlink_url: (body.plan === "premium" && (!body.backlink_url || body.backlink_url.trim() === "")) 
        ? body.website_url 
        : (body.backlink_url || ""),
      backlink_verified: body.backlink_verified || false,
      
      // Approval system (as per CLAUDE.md spec)
      approved: body.approved !== undefined ? body.approved : false,
      payment_status: body.payment_status || false,
      
      // Link Type Management (Simplified system)
      // Standard Launch: 15 slots/week, nofollow by default, can earn dofollow + badge via top 3
      // Premium Launch: 10 slots/week, guaranteed dofollow after approval, can also earn badges
      link_type: "nofollow", // Will be set to dofollow upon approval for premium plans
      dofollow_status: false, // Will be set to true upon approval for premium plans
      dofollow_reason: undefined, // Will be set upon approval
      dofollow_awarded_at: undefined, // Will be set upon approval
      
      // Plan features
      premium_badge: planDetails.premium_badge,
      skip_queue: planDetails.skip_queue,
      social_promotion: planDetails.social_promotion,
      guaranteed_backlinks: planDetails.guaranteed_backlinks,
      homepage_duration: planDetails.homepage_duration,
      
      // Competition tracking - Weekly competition only
      weekly_competition_id: selectedWeeklyCompetition.id, // UUID reference to competitions.id
      entered_weekly: true,
      
      // Status and draft flags
      // For standard plans: status is "pending" and not a draft
      // For premium plans: status is "pending" and it's a draft until payment confirmed
      status: body.plan === "standard" ? "pending" : "draft",
      is_draft: body.plan === "premium", // Premium submissions are drafts until paid
      featured: false,
      homepage_featured: false,
      
      // Metrics
      views: 0,
      upvotes: 0,
      clicks: 0,
      total_engagement: 0,
      
      // Rankings
      weekly_ranking: null,
      overall_ranking: null,
      ranking_score: 0,
      weekly_score: 0,
      
      // Competition results
      weekly_winner: false,
      weekly_position: null,
      
      // Homepage presence
      homepage_start_date: now,
      homepage_end_date: new Date(now.getTime() + planDetails.homepage_duration * 24 * 60 * 60 * 1000),
      
      // SEO
      meta_title: body.meta_title || body.name,
      meta_description: body.meta_description || body.short_description,
      
      // Timestamps (created_at and updated_at are handled by DB defaults/triggers)
      published_at: null, // Will be set upon approval
      launched_at: null, // Will be set upon approval
    };

    let result;
    
    if (isUpdatingDraft) {
      // Update existing draft
      console.log('Updating existing draft:', {
        id: existingDraft.id,
        name: directoryData.name,
        slug: directoryData.slug,
        plan: directoryData.plan,
        status: directoryData.status,
        is_draft: directoryData.is_draft
      });
      
      await db.updateOne(
        "apps",
        { id: existingDraft.id },
        { $set: { ...directoryData, updated_at: new Date() } }
      );
      
      result = { insertedId: existingDraft.id };
    } else {
      // Insert new directory
      console.log('Inserting new directory:', {
        name: directoryData.name,
        slug: directoryData.slug,
        plan: directoryData.plan,
        status: directoryData.status,
        is_draft: directoryData.is_draft,
        payment_status: directoryData.payment_status
      });
      
      result = await db.insertOne("apps", directoryData);
    }
    
    console.log('Directory created successfully:', {
      id: result.insertedId.toString(),
      slug
    });
    
    // Dispatch webhook event for new directory
    try {
      await webhookEvents.directoryCreated({
        ...directoryData,
        id: result.id
      });
    } catch (webhookError) {
      console.error("Webhook dispatch failed:", webhookError);
      // Don't fail the directory submission if webhook fails
    }
    
    // Update user submission count
    await db.updateOne(
      "users",
      { id: user.id },
      {
        $inc: { total_submissions: 1 },
        $set: { updated_at: new Date() },
      }
    );

    // Update competition submission counts
    // Only increment for standard plans (free) - premium plans will be counted after payment
    if (body.plan === "standard") {
      console.log('Updating competition submission counts:', {
        competition_id: selectedWeeklyCompetition.competition_id,
        plan: body.plan,
        incrementField: `${body.plan}_submissions`
      });
      
      const competitionUpdateResult = await db.updateOne(
        "competitions",
        { competition_id: selectedWeeklyCompetition.competition_id },
        {
          $inc: { 
            total_submissions: 1,
            [`${body.plan}_submissions`]: 1,
          },
          $set: { updated_at: new Date() },
        }
      );
      
      console.log('Competition update result:', {
        matchedCount: competitionUpdateResult.matchedCount,
        modifiedCount: competitionUpdateResult.modifiedCount,
        success: competitionUpdateResult.matchedCount > 0
      });
      
      // Verify the update was successful
      if (competitionUpdateResult.matchedCount === 0) {
        console.error('WARNING: Competition update matched 0 records!', {
          competition_id: selectedWeeklyCompetition.competition_id,
          filter_used: { competition_id: selectedWeeklyCompetition.competition_id }
        });
      }
    } else {
      console.log('Skipping competition count increment for premium plan - will be counted after payment confirmation');
    }


    return NextResponse.json({
      success: true,
        data: {
          id: result.insertedId.toString(),
          slug,
          status: directoryData.status,
          is_draft: directoryData.is_draft,
          message: body.plan === "premium"
            ? isUpdatingDraft 
              ? "Draft updated successfully! Complete payment to submit your premium launch."
              : "Draft saved successfully! Complete payment to submit your premium launch. You can find it in your dashboard."
            : isUpdatingDraft
              ? `AI project updated and scheduled for launch week ${body.launch_week}!`
              : `AI project scheduled for launch week ${body.launch_week}. You'll receive a nofollow link when it launches. Top 3 winners get dofollow links + badges!`,
          launch_date: directoryData.launch_date,
        },
    });

  } catch (error) {
    console.error("Directory submission error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR", message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/directories - Update a directory
export async function PUT(request) {
  try {
    // Check authentication with proper cookie-based session
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
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { directoryId, ...updateFields } = body;
    
    if (!directoryId) {
      return NextResponse.json(
        { error: "AI Project ID is required", code: "MISSING_ID" },
        { status: 400 }
      );
    }
    
    // Verify the AI project exists and belongs to the user
    const existingDirectory = await db.findOne("apps", {
      id: directoryId,
      submitted_by: user.id
    });

    if (!existingDirectory) {
      return NextResponse.json(
        { error: "AI Project not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Basic validation for required fields
    if (updateFields.name && !updateFields.name.trim()) {
      return NextResponse.json(
        { error: "AI project name cannot be empty", code: "INVALID_NAME" },
        { status: 400 }
      );
    }
    
    if (updateFields.website_url && !updateFields.website_url.match(/^https?:\/\/.+/)) {
      return NextResponse.json(
        { error: "Invalid website URL", code: "INVALID_URL" },
        { status: 400 }
      );
    }

    // Prepare update data - only update fields that are provided
    const updateData = {
      updated_at: new Date()
    };

    // Update basic fields if provided
    if (updateFields.name) {
      updateData.name = updateFields.name;
      // Update slug if name changed
      updateData.slug = updateFields.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
    
    if (updateFields.short_description) updateData.short_description = updateFields.short_description;
    if (updateFields.full_description) updateData.full_description = updateFields.full_description;
    if (updateFields.website_url) updateData.website_url = updateFields.website_url;
    if (updateFields.logo_url) updateData.logo_url = updateFields.logo_url;
    if (updateFields.screenshots) updateData.screenshots = updateFields.screenshots;
    if (updateFields.video_url !== undefined) updateData.video_url = updateFields.video_url;
    if (updateFields.categories) updateData.categories = updateFields.categories;
    if (updateFields.pricing) updateData.pricing = updateFields.pricing;
    if (updateFields.tags) updateData.tags = updateFields.tags;
    if (updateFields.contact_email) updateData.contact_email = updateFields.contact_email;
    if (updateFields.maker_name) updateData.maker_name = updateFields.maker_name;
    if (updateFields.maker_twitter) updateData.maker_twitter = updateFields.maker_twitter;
    if (updateFields.backlink_url) updateData.backlink_url = updateFields.backlink_url;
    if (updateFields.launch_week) updateData.launch_week = updateFields.launch_week;
    
    // Handle new spec fields
    if (updateFields.approved !== undefined) updateData.approved = updateFields.approved;
    if (updateFields.backlink_verified !== undefined) updateData.backlink_verified = updateFields.backlink_verified;
    if (updateFields.payment_status !== undefined) updateData.payment_status = updateFields.payment_status;
    if (updateFields.dofollow_status !== undefined) updateData.dofollow_status = updateFields.dofollow_status;

    // For premium directories, ensure they're properly set up
    if (existingDirectory.plan === "premium" && existingDirectory.payment_status === "paid") {
      updateData.status = "live"; // Premium directories go live immediately
      updateData.published_at = new Date();
      updateData.launched_at = new Date();
    }

    // Update the directory
    const result = await db.updateOne(
      "apps",
      { id: directoryId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "AI Project not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get updated AI project
    const updatedDirectory = await db.findOne("apps", { id: directoryId });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedDirectory.id,
        slug: updatedDirectory.slug,
        status: updatedDirectory.status,
        message: "AI project updated successfully!",
      },
    });

  } catch (error) {
    console.error("AI Project update error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/directories - Delete a directory (only drafts can be deleted by users)
export async function DELETE(request) {
  try {
    // Check authentication with proper cookie-based session
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
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const directoryId = searchParams.get("id");
    
    if (!directoryId) {
      return NextResponse.json(
        { error: "Directory ID is required", code: "MISSING_ID" },
        { status: 400 }
      );
    }
    
    // Verify the directory exists and belongs to the user
    const existingDirectory = await db.findOne("apps", {
      id: directoryId,
      submitted_by: user.id
    });

    if (!existingDirectory) {
      return NextResponse.json(
        { error: "Directory not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Only allow deletion of drafts
    if (!existingDirectory.is_draft && existingDirectory.status !== "draft") {
      return NextResponse.json(
        { error: "Only drafts can be deleted", code: "INVALID_STATUS" },
        { status: 400 }
      );
    }

    // Delete the directory
    await db.deleteOne("apps", { id: directoryId });

    return NextResponse.json({
      success: true,
      message: "Draft deleted successfully",
    });

  } catch (error) {
    console.error("Directory deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}