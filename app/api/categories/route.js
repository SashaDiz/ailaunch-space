import { NextResponse } from "next/server";
import { db } from "../../libs/database.js";

// GET /api/categories?type=categories|pricing - Get categories or pricing data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "categories";
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
      name: error.name
    });
    return NextResponse.json(
      { 
        error: "Internal server error", 
        code: "INTERNAL_ERROR",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      sort: { name: 1 }, // Sort alphabetically
    });

  let categoriesWithCount = categories;

  // If includeCount is requested, add app count for each category
  if (includeCount) {
    categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const appCount = await db.count("apps", {
          status: "live",
          categories: { $in: [category.slug, category.name] }
        });
        return {
          ...category,
          app_count: appCount,
        };
      })
    );
  }

    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesWithCount,
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
      label: "Premium/Paid", 
      description: "Paid subscription or one-time purchase",
      keywords: ["paid", "premium", "subscription", "$", "buy", "purchase", "pro", "plus"]
    }
  ];

  let pricingWithCount = pricingOptions;

  // If includeCount is requested, add directory count for each pricing option
  if (includeCount) {
    pricingWithCount = await Promise.all(
      pricingOptions.map(async (pricing) => {
        let appCount = 0;
        
        switch (pricing.value) {
          case "free":
            appCount = await db.count("apps", {
              status: "live",
              $or: [
                { pricing: { $regex: /free/i } },
                { pricing: { $exists: false } },
                { pricing: "" }
              ]
            });
            break;
          case "freemium":
            appCount = await db.count("apps", {
              status: "live",
              pricing: { $regex: /freemium/i }
            });
            break;
          case "paid":
            appCount = await db.count("apps", {
              status: "live",
              $and: [
                { pricing: { $exists: true } },
                { pricing: { $ne: "" } },
                { pricing: { $not: { $regex: /free/i } } },
                { pricing: { $not: { $regex: /^freemium$/i } } }
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