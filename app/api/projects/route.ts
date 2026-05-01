import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { db } from '@/lib/supabase/database';
import { webhookEvents } from '@/lib/webhooks';
import { notificationManager } from '@/lib/notifications';
// import { ProjectSubmissionSchema } from '@/lib/validations/schemas';

// GET /api/projects - Get AI projects with filtering and sorting
export async function GET(request) {
  try {
    // Check rate limiting for GET requests
    const { checkRateLimit, createRateLimitResponse } = await import("@/lib/rate-limit");
    const rateLimitResult = await checkRateLimit(request, 'general');
    if (!rateLimitResult.allowed) {
      const rateLimitResponse = createRateLimitResponse(rateLimitResult);
      return new NextResponse(rateLimitResponse.body, {
        status: rateLimitResponse.status,
        headers: rateLimitResponse.headers,
      });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");
    
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
            existing_project: existingSlug.name,
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
          const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();
          // Normalize pathname (remove trailing slash, keep as-is otherwise)
          const pathname = urlObj.pathname === '/' ? '' : urlObj.pathname.replace(/\/$/, '');
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
          existing_project: duplicateWebsite.name,
        });
      }
      
      return NextResponse.json({
        exists: false,
      });
    }
    
    // Special section for homepage featured products (recent live premium projects)
    if (section === "featured") {
      try {
        const premiumProjects = await db.find(
          "apps",
          { status: "live", plan: "premium" },
          {
            sort: { premium_badge: -1, upvotes: -1, created_at: -1 },
            limit: 50,
          }
        );
        const previousWinners = [];

        if ((!premiumProjects || premiumProjects.length === 0) &&
            (!previousWinners || previousWinners.length === 0)) {
          return NextResponse.json({
            success: true,
            data: {
              premiumProjects: [],
              previousWinners: [],
              previousCompetition: null,
            },
          });
        }

        // Enrich projects with bookmark info
        let userBookmarksFeatured: Record<string, boolean> = {};

        const allProjectsRaw = [...premiumProjects, ...previousWinners];
        const uniqueProjectsMap = new Map();
        for (const project of allProjectsRaw) {
          if (!uniqueProjectsMap.has(project.id)) {
            uniqueProjectsMap.set(project.id, project);
          }
        }
        const allProjects = Array.from(uniqueProjectsMap.values());

        // Attach user vote info if authenticated
        if (allProjects.length > 0) {
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

          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user?.id) {
            const appIds = allProjects.map((project) => project.id);
            const bookmarks = await db.find("bookmarks", { user_id: user.id, app_id: { $in: appIds } });

            userBookmarksFeatured = bookmarks.reduce((acc: Record<string, boolean>, b: any) => {
              acc[b.app_id] = true;
              return acc;
            }, {});
          }
        }

        const projectsWithCompetitions = await Promise.all(
          allProjects.map(async (project) => {
            let competitions = [];
            let competitionStatus = "unknown";
            let statusBadge = "live";
            let canVote = false;

            if (project.weekly_competition_id) {
              competitions = await db.find("competitions", {
                id: project.weekly_competition_id,
              });

              if (competitions.length > 0) {
                const competition = competitions[0];
                const now = new Date();
                const startDate = new Date(competition.start_date);
                const endDate = new Date(competition.end_date);

                if (endDate < now) {
                  competitionStatus = "completed";
                  statusBadge = "past";
                  canVote = false;
                } else if (startDate > now) {
                  competitionStatus = "upcoming";
                  statusBadge = "scheduled";
                  canVote = false;
                } else {
                  competitionStatus = "active";
                  statusBadge = "live";
                  canVote = true;
                }
              }
            }

            return {
              ...project,
              userVoted: false,
              userBookmarked: userBookmarksFeatured[project.id] || false,
              competitions,
              competitionStatus,
              statusBadge,
              canVote,
            };
          })
        );

        const enrichedMap = new Map(
          projectsWithCompetitions.map((p) => [p.id, p])
        );

        const premiumEnriched = premiumProjects
          .map((p) => enrichedMap.get(p.id))
          .filter(Boolean);

        const winnersEnriched = previousWinners
          .map((p) => enrichedMap.get(p.id))
          .filter(Boolean);

        return NextResponse.json({
          success: true,
          data: {
            premiumProjects: premiumEnriched,
            previousWinners: winnersEnriched,
            previousCompetition: null,
          },
        });
      } catch (error) {
        console.error("Featured projects API error:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
          url: request.url,
        });

        return NextResponse.json(
          {
            error: "Failed to load featured projects",
            code: "FEATURED_SECTION_ERROR",
            message: error.message,
          },
          { status: 500 }
        );
      }
    }

    // Validate and limit pagination parameters (default listing behaviour)
    const page = Math.max(1, Math.min(100, parseInt(searchParams.get("page") || "1") || 1));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10") || 10));
    const category = searchParams.get("category"); // Legacy single category
    const categories = searchParams.get("categories"); // New multiple categories
    const pricing = searchParams.get("pricing");
    const competition = searchParams.get("competition"); // 'weekly'
    const status = searchParams.get("status") || "live";
    const sort = searchParams.get("sort") || "upvotes"; // 'upvotes', 'recent', 'views'
    const search = searchParams.get("search");

    // Build query filter
    const filter: Record<string, any> = { status };
    
    // Handle multiple categories (new approach)
    if (categories) {
      const categoryList = categories.split(',').filter(cat => cat.trim());
      if (categoryList.length > 0) {
        // For multiple categories, we need to find all matching categories first
        const categoryDocs = await db.find("categories", {
          $or: categoryList.map(cat => [
            { slug: cat },
            { name: cat }
          ]).flat()
        });
        
        if (categoryDocs.length > 0) {
          // Create array of all possible category identifiers
          const allCategoryIds = categoryDocs.reduce((acc, doc) => {
            acc.push(doc.slug, doc.name);
            return acc;
          }, []);
          
          filter.categories = { $overlaps: allCategoryIds };
        } else {
          // Fallback to direct category slugs/names
          filter.categories = { $overlaps: categoryList };
        }
      }
    }
    // Legacy single category support
    else if (category && category !== "all") {
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
          $overlaps: [categoryDoc.slug, categoryDoc.name] 
        };
      } else {
        // Fallback to original category filter
        filter.categories = { $overlaps: [category] };
      }
    }

    // Handle search filter with enhanced security
    if (search) {
      // Limit search query length to prevent DoS
      const MAX_SEARCH_LENGTH = 100;
      const trimmedSearch = search.trim();
      
      if (trimmedSearch.length > MAX_SEARCH_LENGTH) {
        return NextResponse.json(
          { 
            error: `Search query too long. Maximum ${MAX_SEARCH_LENGTH} characters.`, 
            code: "SEARCH_TOO_LONG"
          },
          { status: 400 }
        );
      }
      
      // Escape special regex characters to prevent ReDoS attacks
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const safeSearch = escapeRegex(trimmedSearch);
      
      // Additional validation: ensure search doesn't contain only special characters
      if (safeSearch.replace(/\\/g, '').length === 0) {
        return NextResponse.json(
          { 
            error: "Invalid search query.", 
            code: "INVALID_SEARCH"
          },
          { status: 400 }
        );
      }
      
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { short_description: { $regex: safeSearch, $options: "i" } },
      ];
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

    // Show all live projects (main listing) regardless of status (Scheduled/Live/Past).
    // Date-based filtering for badges is done on the frontend.

    // Build sort options from directory config (single source of truth)
    const { getSortFields } = await import('@/config/directory.config');
    const sortOptions = getSortFields(sort);

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    let totalCount;
    try {
      totalCount = await db.count("apps", filter);
    } catch (countError) {
      console.error('Count query failed:', countError);
      
      // If this is a connection error, use 0 as fallback
      if (countError.message && (countError.message.includes('502') || countError.message.includes('Bad Gateway'))) {
        console.warn('Count query failed, using 0 as fallback');
        totalCount = 0;
      } else {
        throw countError;
      }
    }
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch AI projects with sorting
    let projects;
    try {
      projects = await db.find(
        "apps", 
        filter,
        {
          sort: sortOptions,
          limit,
          skip,
        }
      );
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      
      // If this is a connection error, return empty results with a warning
      if (dbError.message && (dbError.message.includes('502') || dbError.message.includes('Bad Gateway'))) {
        console.warn('Database connection failed, returning empty results');
        return NextResponse.json({
          success: true,
          data: {
            projects: [],
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
            warning: "Database temporarily unavailable. Please try again later."
          },
        });
      }
      
      // Re-throw other database errors
      throw dbError;
    }

    // Get user's bookmarks if authenticated
    let userBookmarks: Record<string, boolean> = {};

    // Check user session properly with cookie-based auth
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

    if (user?.id && projects.length > 0) {
      const appIds = projects.map(project => project.id);
      const bookmarks = await db.find("bookmarks", { user_id: user.id, app_id: { $in: appIds } });

      userBookmarks = bookmarks.reduce((acc: Record<string, boolean>, b: any) => {
        acc[b.app_id] = true;
        return acc;
      }, {});
    }

    // Get competition data for each AI project and determine status badges
    const projectsWithCompetitions = await Promise.all(
      projects.map(async (project) => {
        let competitions = [];
        let competitionStatus = "unknown";
        let statusBadge = "live"; // Default badge
        let canVote = false; // Whether the user can vote for this project
        
        // Check if project is a draft or premium without payment - should show as draft
        // Exception: If premium project is live with premium_badge in active competition, allow voting
        const isDraft = project.is_draft === true || project.status === "draft";
        const isPremiumUnpaid = project.plan === "premium" && project.payment_status !== true;
        const isPremiumLiveInCompetition = project.plan === "premium" && 
                                          project.status === "live" && 
                                          project.premium_badge === true &&
                                          project.weekly_competition_id;
        
        if ((isDraft || isPremiumUnpaid) && !isPremiumLiveInCompetition) {
          statusBadge = "draft";
          canVote = false;
        } else if (project.weekly_competition_id) {
          competitions = await db.find("competitions", {
            id: project.weekly_competition_id,
          });
          
          if (competitions.length > 0) {
            const competition = competitions[0];
            const now = new Date();
            const startDate = new Date(competition.start_date);
            const endDate = new Date(competition.end_date);
            
            // Determine competition status and voting availability
            if (endDate < now) {
              // Competition has ended
              competitionStatus = "completed";
              statusBadge = "past";
              canVote = false;
            } else if (startDate > now) {
              // Competition has not started yet
              competitionStatus = "upcoming";
              statusBadge = "scheduled";
              canVote = false;
            } else {
              // Competition is currently active
              competitionStatus = "active";
              statusBadge = "live";
              canVote = true;
            }
          }
        }
        
        return {
          ...project,
          userVoted: false,
          userBookmarked: userBookmarks[project.id] || false,
          competitions: competitions,
          competitionStatus: competitionStatus,
          statusBadge: statusBadge, // "draft", "scheduled", "live", "past"
          canVote: canVote, // Whether the user can vote for this project
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        projects: projectsWithCompetitions,
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
    console.error("AI Projects API error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      url: request.url
    });
    
    // Check if this is a Supabase connection error
    if (error.message && error.message.includes('502 Bad Gateway')) {
      console.error('Supabase connection failed - 502 Bad Gateway. This may indicate:');
      console.error('1. Supabase service is down or experiencing issues');
      console.error('2. Incorrect Supabase URL or service key');
      console.error('3. Network connectivity issues');
      console.error('4. Rate limiting or IP blocking');
      
      return NextResponse.json(
        { 
          error: "Database connection failed", 
          code: "DATABASE_CONNECTION_ERROR",
          message: "Unable to connect to the database. Please try again later.",
          details: process.env.NODE_ENV === 'development' ? error.message : "Database connection error"
        },
        { status: 503 }
      );
    }
    
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

// POST /api/projects - Create a new AI project (submission)
export async function POST(request) {
  try {
    // Check rate limiting first
    const { checkRateLimit, createRateLimitResponse } = await import("@/lib/rate-limit");
    const rateLimitResult = await checkRateLimit(request, 'submission');
    if (!rateLimitResult.allowed) {
      const rateLimitResponse = createRateLimitResponse(rateLimitResult);
      return new NextResponse(rateLimitResponse.body, {
        status: rateLimitResponse.status,
        headers: rateLimitResponse.headers,
      });
    }

    // Check request size limit (prevent DoS attacks)
    const contentLength = request.headers.get('content-length');
    const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { 
          error: "Request too large. Maximum size is 10MB.", 
          code: "REQUEST_TOO_LARGE"
        },
        { status: 413 }
      );
    }

    // Check authentication with proper cookie-based session
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      getSupabaseUrl(),
      getSupabasePublishableKey(),
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

    // Parse and validate request body with timeout protection
    let body;
    try {
      const bodyText = await request.text();
      if (bodyText.length > MAX_REQUEST_SIZE) {
        return NextResponse.json(
          { 
            error: "Request body too large.", 
            code: "REQUEST_TOO_LARGE"
          },
          { status: 413 }
        );
      }
      body = JSON.parse(bodyText);
    } catch (parseError) {
      return NextResponse.json(
        { 
          error: "Invalid JSON in request body.", 
          code: "INVALID_JSON"
        },
        { status: 400 }
      );
    }
    
    // Validate input types
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { 
          error: "Invalid request body format.", 
          code: "INVALID_BODY"
        },
        { status: 400 }
      );
    }
    
    const requiredFields = ["name", "short_description", "website_url", "categories", "plan"];
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

    // Validate URL formats with security checks
    const { validation } = await import("@/lib/rate-limit");
    
    if (!validation.isValidURL(body.website_url)) {
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
    
    // Validate categories array
    if (!Array.isArray(body.categories) || body.categories.length === 0) {
      return NextResponse.json(
        { 
          error: "Categories must be a non-empty array", 
          code: "INVALID_CATEGORIES",
          fields: ["categories"],
        },
        { status: 400 }
      );
    }
    
    // Limit categories array size
    if (body.categories.length > 5) {
      return NextResponse.json(
        { 
          error: "Maximum 5 categories allowed", 
          code: "TOO_MANY_CATEGORIES",
          fields: ["categories"],
        },
        { status: 400 }
      );
    }
    
    // Validate category values are strings
    if (!body.categories.every(cat => typeof cat === 'string' && cat.length > 0 && cat.length <= 50)) {
      return NextResponse.json(
        { 
          error: "Invalid category format", 
          code: "INVALID_CATEGORY_FORMAT",
          fields: ["categories"],
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

    if (!validation.isValidURL(body.logo_url)) {
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
      if (!validation.isValidURL(body.video_url)) {
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
    
    // Sanitize string inputs
    if (body.name) {
      body.name = validation.sanitizeString(body.name, 100);
    }
    if (body.short_description) {
      body.short_description = validation.sanitizeString(body.short_description, 160);
    }
    if (body.full_description) {
      body.full_description = validation.sanitizeString(body.full_description, 2000);
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
        // Return the existing draft ID so we can update it instead of creating new
        // This will be handled in the project creation logic below
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
        const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();
        // Normalize pathname (remove trailing slash, keep as-is otherwise)
        const pathname = urlObj.pathname === '/' ? '' : urlObj.pathname.replace(/\/$/, '');
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
        // Will be handled in the project creation logic below
      } else {
        return NextResponse.json(
          { 
            error: `This website (${body.website_url}) has already been submitted as "${duplicateWebsite.name}"`, 
            code: "WEBSITE_EXISTS",
            existing_project: duplicateWebsite.name,
          },
          { status: 400 }
        );
      }
    }

    // Calculate current week and month IDs
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    
    const startOfYear = new Date(currentYear, 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
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

    // Create AI project object
    // For premium plans, DON'T set premium features until payment is confirmed
    // This prevents unpaid premium drafts from showing as "Scheduled"
    const isPremiumPaidOrStandard = body.plan === "standard";
    
    const projectData = {
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
      // For premium plans, don't schedule until payment is confirmed
      // For standard plans, schedule immediately (it's free)
      scheduled_launch: body.plan === "standard",
      
      // Contact and ownership
      contact_email: user.email,
      submitted_by: user.id,
      maker_name: (user as any).name || user.user_metadata?.full_name || user.email?.split('@')[0],
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
      
      // Plan features - ONLY set for standard plans; premium features are set after payment
      // This ensures unpaid premium drafts are shown as "Draft" not "Scheduled"
      premium_badge: isPremiumPaidOrStandard ? planDetails.premium_badge : false,
      skip_queue: isPremiumPaidOrStandard ? planDetails.skip_queue : false,
      social_promotion: isPremiumPaidOrStandard ? planDetails.social_promotion : false,
      guaranteed_backlinks: planDetails.guaranteed_backlinks,
      homepage_duration: planDetails.homepage_duration,
      
      weekly_competition_id: null,
      entered_weekly: false,
      
      // Status and draft flags
      // For standard plans: status is "pending" and not a draft
      // For premium plans: status is "pending" and it's a draft until payment confirmed
      status: body.plan === "standard" ? "pending" : "draft",
      is_draft: body.plan === "premium", // Premium submissions are drafts until paid
      
      // Store checkout_session_id if provided (for linking with payments)
      checkout_session_id: body.checkout_session_id || null,
      featured: false,
      homepage_featured: false,
      
      // Metrics
      views: 0,
      upvotes: 0,
      clicks: 0,
      total_engagement: 0,
      
      // Rankings
      // CUSTOMIZE: Add ranking calculation logic here
      // ranking_score can be based on engagement metrics (views, upvotes, bookmarks)
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
      await db.updateOne(
        "apps",
        { id: existingDraft.id },
        { $set: { ...projectData, updated_at: new Date() } }
      );
      
      result = { insertedId: existingDraft.id };
    } else {
      // Insert new AI project
      result = await db.insertOne("apps", projectData);
    }

    const newProjectId = result.insertedId.toString();

    // CRITICAL: For premium projects, check for payments and link them
    // This handles multiple scenarios:
    // 1. Payment made before project creation
    // 2. Payment made after project creation (via checkout_session_id)
    // 3. Webhook already processed payment but project wasn't found
    if (body.plan === "premium" && user.id) {
      try {
        let payment = null;
        
        // Priority 1: Check if project has checkout_session_id and find payment by it
        if (projectData.checkout_session_id) {
          payment = await db.findOne("payments", {
            invoice_id: projectData.checkout_session_id,
            user_id: user.id,
            status: "completed",
          });
          
          if (!payment) {
            // Also check by payment_intent if invoice_id doesn't match
            payment = await db.findOne("payments", {
              payment_id: projectData.checkout_session_id,
              user_id: user.id,
              status: "completed",
            });
          }
          
        }

        // Priority 2: Find unlinked completed payments for this user (most recent first)
        if (!payment) {
          const unlinkedPayments = await db.find("payments", {
            user_id: user.id,
            plan: "premium",
            status: "completed",
            app_id: null,
          }, {
            sort: { paid_at: -1 },
            limit: 1,
          });
          
          if (unlinkedPayments.length > 0) {
            payment = unlinkedPayments[0];
          }
        }
        
        // If payment found, link it and activate premium features
        if (payment) {
          // Link payment to project
          await db.updateOne("payments", { id: payment.id }, {
            $set: { app_id: newProjectId }
          });
          
          // Apply payment status and premium features to project
          const premiumUpdateData = {
            payment_status: true,
            is_draft: false,
            scheduled_launch: true,
            status: "pending",
            premium_badge: true,
            skip_queue: true,
            social_promotion: true,
            guaranteed_backlinks: typeof projectData.guaranteed_backlinks === "number" 
              ? projectData.guaranteed_backlinks 
              : 3,
            link_type: "dofollow",
            dofollow_status: true,
            dofollow_reason: "premium_plan",
            dofollow_awarded_at: new Date(),
            order_id: payment.payment_id,
            payment_date: payment.paid_at || new Date(),
            updated_at: new Date(),
          };
          
          await db.updateOne("apps", { id: newProjectId }, {
            $set: premiumUpdateData
          });
          
          // CRITICAL: Verify that dofollow was applied correctly
          const verifiedProject = await db.findOne("apps", { id: newProjectId });
          if (verifiedProject.link_type !== "dofollow" || verifiedProject.dofollow_status !== true) {
            console.warn("Dofollow not applied correctly after payment link, fixing:", {
              projectId: newProjectId,
              link_type: verifiedProject.link_type,
              dofollow_status: verifiedProject.dofollow_status,
            });
            
            await db.updateOne("apps", { id: newProjectId }, {
              $set: {
                link_type: "dofollow",
                dofollow_status: true,
                dofollow_reason: "premium_plan",
                premium_badge: true,
                dofollow_awarded_at: verifiedProject.dofollow_awarded_at || new Date(),
              },
            });
          }
        } else if (projectData.checkout_session_id) {
          // Payment not found yet - might be processing
          // Wait a bit and check again (webhook might be processing)

          // Wait 3 seconds for webhook to process
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check again
          payment = await db.findOne("payments", {
            invoice_id: projectData.checkout_session_id,
            user_id: user.id,
            status: "completed",
          });
          
          if (payment) {
            // Link payment and activate premium features
            await db.updateOne("payments", { id: payment.id }, {
              $set: { app_id: newProjectId }
            });
            
            const premiumUpdateData = {
              payment_status: true,
              is_draft: false,
              scheduled_launch: true,
              status: "pending",
              premium_badge: true,
              skip_queue: true,
              social_promotion: true,
              guaranteed_backlinks: typeof projectData.guaranteed_backlinks === "number" 
                ? projectData.guaranteed_backlinks 
                : 3,
              // CRITICAL: Always set dofollow for premium plans
              link_type: "dofollow",
              dofollow_status: true,
              dofollow_reason: "premium_plan",
              dofollow_awarded_at: new Date(),
              order_id: payment.payment_id,
              payment_date: payment.paid_at || new Date(),
              updated_at: new Date(),
            };
            
            await db.updateOne("apps", { id: newProjectId }, {
              $set: premiumUpdateData
            });
            
            // CRITICAL: Verify that dofollow was applied correctly
            const verifiedProject = await db.findOne("apps", { id: newProjectId });
            if (verifiedProject.link_type !== "dofollow" || verifiedProject.dofollow_status !== true) {
              console.warn("Dofollow not applied correctly after payment link (retry), fixing:", {
                projectId: newProjectId,
                link_type: verifiedProject.link_type,
                dofollow_status: verifiedProject.dofollow_status,
              });
              
              await db.updateOne("apps", { id: newProjectId }, {
                $set: {
                  link_type: "dofollow",
                  dofollow_status: true,
                  dofollow_reason: "premium_plan",
                  premium_badge: true,
                  dofollow_awarded_at: verifiedProject.dofollow_awarded_at || new Date(),
                },
              });
            }
          } else {
            // Payment still not found - set payment_initiated_at so webhook can find this project later
            await db.updateOne("apps", { id: newProjectId }, {
              $set: {
                payment_initiated_at: new Date(),
                updated_at: new Date(),
              }
            });
          }
        }
      } catch (linkError) {
        console.error("Failed to auto-link payment to new project:", linkError);
        // Don't fail project creation if linking fails - it will be fixed on dashboard load
      }
    }
    
    // Dispatch webhook event for new AI project
    try {
      await webhookEvents.projectCreated({
        ...projectData,
        id: result.insertedId
      });
    } catch (webhookError) {
      console.error("Webhook dispatch failed:", webhookError);
      // Don't fail the AI project submission if webhook fails
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

    // Send submission received notification
    try {
      if (user && user.email) {
        await notificationManager.sendSubmissionReceivedNotification({
          userId: user.id,
          userEmail: user.email,
          project: {
            id: result.insertedId,
            name: projectData.name,
            slug: projectData.slug
          }
        });
      }
    } catch (notificationError) {
      console.error("Failed to send submission received notification:", notificationError);
      // Don't fail the submission if notification fails
    }

    return NextResponse.json({
      success: true,
        data: {
          id: result.insertedId.toString(),
          slug,
          status: projectData.status,
          is_draft: projectData.is_draft,
          message: body.plan === "premium"
            ? isUpdatingDraft
              ? "Draft updated successfully! Complete payment to submit your premium launch."
              : "Draft saved successfully! Complete payment to submit your premium launch. You can find it in your dashboard."
            : isUpdatingDraft
              ? "Project updated and submitted for review!"
              : "Project submitted for review! You'll be notified once it's approved.",
          launch_date: projectData.launched_at,
        },
    });

  } catch (error) {
    console.error("AI project submission error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR", message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/projects - Update an AI project
export async function PUT(request) {
  try {
    // Check authentication with proper cookie-based session
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
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, ...updateFields } = body;
    
    if (!projectId) {
      return NextResponse.json(
        { error: "AI Project ID is required", code: "MISSING_ID" },
        { status: 400 }
      );
    }
    
    // Verify the AI project exists and belongs to the user
    const existingProject = await db.findOne("apps", {
      id: projectId,
      submitted_by: user.id
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "AI Project not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Only allow edits before the launch starts
    const editableStatuses = ["draft", "pending", "scheduled"];

    // Block edits for projects that are already live/past/approved
    if (!editableStatuses.includes(existingProject.status || "")) {
      return NextResponse.json(
        {
          error: "Projects from current or past launches can't be modified",
          code: "EDIT_LOCKED",
        },
        { status: 403 }
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
    const updateData: Record<string, any> = {
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
    // contact_email and maker_name are now derived from user account
    // if (updateFields.contact_email) updateData.contact_email = updateFields.contact_email;
    // if (updateFields.maker_name) updateData.maker_name = updateFields.maker_name;
    if (updateFields.maker_twitter) updateData.maker_twitter = updateFields.maker_twitter;
    if (updateFields.backlink_url) updateData.backlink_url = updateFields.backlink_url;
    
    // Handle new spec fields
    if (updateFields.approved !== undefined) updateData.approved = updateFields.approved;
    if (updateFields.backlink_verified !== undefined) updateData.backlink_verified = updateFields.backlink_verified;
    if (updateFields.payment_status !== undefined) updateData.payment_status = updateFields.payment_status;
    if (updateFields.dofollow_status !== undefined) updateData.dofollow_status = updateFields.dofollow_status;

    // For premium projects, ensure they're properly set up
    if (existingProject.plan === "premium" && existingProject.payment_status === "paid") {
      updateData.status = "live"; // Premium projects go live immediately
      updateData.published_at = new Date();
      updateData.launched_at = new Date();
    }

    // Update the project
    const result = await db.updateOne(
      "apps",
      { id: projectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Project not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get updated project
    const updatedProject = await db.findOne("apps", { id: projectId });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedProject.id,
        slug: updatedProject.slug,
        status: updatedProject.status,
        message: "Project updated successfully!",
      },
    });

  } catch (error) {
    console.error("Project update error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects - Delete a project (only drafts can be deleted by users)
export async function DELETE(request) {
  try {
    // Check authentication with proper cookie-based session
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
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("id");
    
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required", code: "MISSING_ID" },
        { status: 400 }
      );
    }
    
    // Verify the AI project exists and belongs to the user
    const existingProject = await db.findOne("apps", {
      id: projectId,
      submitted_by: user.id
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Only allow deletion of drafts
    if (!existingProject.is_draft && existingProject.status !== "draft") {
      return NextResponse.json(
        { error: "Only drafts can be deleted", code: "INVALID_STATUS" },
        { status: 400 }
      );
    }

    // Delete the project
    await db.deleteOne("apps", { id: projectId });

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });

  } catch (error) {
    console.error("Project deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}