import { NextResponse } from "next/server";
import { db } from '@/lib/supabase/database';
import { directoryConfig } from '@/config/directory.config';

// Seed categories from config — auto-created if missing from the database
const REQUIRED_CATEGORIES = directoryConfig.seedCategories.map((cat) => ({
  ...cat,
  featured: cat.featured ?? false,
}));

// GET /api/categories?type=categories|pricing - Get categories or pricing data
export async function GET(request) {
  let type = "categories";
  try {
    // Check rate limiting for public endpoint
    const { checkRateLimit, createRateLimitResponse } = await import("@/lib/rate-limit");
    const rateLimitResult = await checkRateLimit(request, 'general');
    if (!rateLimitResult.allowed) {
      const rateLimitResponse = createRateLimitResponse(rateLimitResult);
      return new NextResponse(rateLimitResponse.body, {
        status: rateLimitResponse.status,
        headers: rateLimitResponse.headers,
      });
    }

    // Verify database connection
    if (!db) {
      console.error("Database client is not initialized");
      return NextResponse.json(
        { 
          error: "Database connection failed", 
          code: "DB_NOT_INITIALIZED",
          message: "Database client is not available"
        },
        { status: 500 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    type = searchParams.get("type") || "categories";
    const includeCount = searchParams.get("includeCount") === "true";

    switch (type) {
      case "categories":
        return await getCategories(includeCount);
      case "pricing":
        return await getPricing(includeCount);
      default:
        return NextResponse.json(
          { error: "Invalid type parameter. Use: categories, pricing" },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("Categories API error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      type
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

// Helper function to get categories
async function getCategories(includeCount) {
  try {
    // Fetch categories from database
    const categories = await db.find("categories", {}, {
      sort: { sort_order: 1, name: 1 }, // Sort by sort_order first, then alphabetically
    });

    // Ensure required categories exist for filters and header dropdown
    const existingSlugs = new Set(categories.map((cat) => cat.slug));
    const missingCategories = REQUIRED_CATEGORIES.filter(
      (cat) => !existingSlugs.has(cat.slug)
    );

    if (missingCategories.length > 0) {
      try {
        await db.insertMany("categories", missingCategories);
        categories.push(...missingCategories);
      } catch (error) {
        console.error("Failed to backfill required categories:", error?.message || error);
        // Still append to in-memory list so UI shows them even if insert fails
        categories.push(...missingCategories);
      }
    }

    let categoriesWithCount = categories;

    // If includeCount is requested, add app count for each category
    if (includeCount) {
      categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          // Count apps that have this category (name or slug) in their categories array
          const identifiers = [category.name, category.slug].filter(Boolean);
          const appCount = await db.count("apps", {
            status: "live",
            categories: { $overlaps: identifiers }
          });
          return {
            ...category,
            app_count: appCount,
          };
        })
      );
    }

    // Group categories by sphere
    const groupedCategories = categoriesWithCount.reduce((acc, category) => {
      const sphere = category.sphere || 'Other';
      if (!acc[sphere]) {
        acc[sphere] = [];
      }
      acc[sphere].push(category);
      return acc;
    }, {});

    // Sort categories alphabetically within each sphere
    Object.keys(groupedCategories).forEach(sphere => {
      groupedCategories[sphere].sort((a, b) => a.name.localeCompare(b.name));
    });

    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesWithCount,
        groupedCategories: groupedCategories,
        total: categories.length,
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
}

// Helper function to get pricing options
async function getPricing(includeCount) {
  try {
    // Define unified pricing options
    const pricingOptions = [
    { 
      value: "free", 
      label: "Free", 
      description: "Completely free to use",
      keywords: ["free", "gratis", "$0", "no cost", "complimentary"]
    },
    { 
      value: "freemium", 
      label: "Freemium", 
      description: "Free with premium features available",
      keywords: ["freemium", "free tier", "free plan", "free trial"]
    },
    { 
      value: "paid", 
      label: "Paid", 
      description: "Paid subscription or one-time purchase",
      keywords: ["paid", "premium", "subscription", "$", "buy", "purchase", "pro", "plus", "one-time"]
    }
  ];

  let pricingWithCount = pricingOptions;

  // If includeCount is requested, add project count for each pricing option
  if (includeCount) {
    pricingWithCount = await Promise.all(
      pricingOptions.map(async (pricing) => {
        let appCount = 0;
        
        switch (pricing.value) {
          case "free":
            appCount = await db.count("apps", {
              status: "live",
              $or: [
                { pricing: "Free" },
                { pricing: { $regex: /free/i } },
                { pricing: { $exists: false } },
                { pricing: "" }
              ]
            });
            break;
          case "freemium":
            appCount = await db.count("apps", {
              status: "live",
              $or: [
                { pricing: "Freemium" },
                { pricing: { $regex: /freemium/i } }
              ]
            });
            break;
          case "paid":
            appCount = await db.count("apps", {
              status: "live",
              $or: [
                { pricing: "Paid" },
                { pricing: { $regex: /paid/i } },
                { pricing: { $regex: /premium/i } },
                { pricing: { $regex: /subscription/i } },
                { pricing: { $regex: /one-time/i } }
              ]
            });
            break;
        }
        
        return {
          ...pricing,
          app_count: appCount,
        };
      })
    );
  }

    return NextResponse.json({
      success: true,
      data: {
        pricing: pricingWithCount,
        total: pricingOptions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching pricing:", error);
    throw error;
  }
}