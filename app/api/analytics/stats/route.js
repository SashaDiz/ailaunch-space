import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../libs/supabase.js";

// Fixed ID for the singleton platform stats record
const PLATFORM_STATS_ID = "00000000-0000-0000-0000-000000000001";

// Export function to update stats directly (for admin API)
export async function updateStatsStorage(visits, pageviews) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Build update object with only provided values
    const updateData = {};
    if (visits !== undefined) {
      const visitsNum = parseInt(visits, 10);
      if (!isNaN(visitsNum) && visitsNum >= 0) {
        updateData.visits = visitsNum;
      }
    }
    if (pageviews !== undefined) {
      const pageviewsNum = parseInt(pageviews, 10);
      if (!isNaN(pageviewsNum) && pageviewsNum >= 0) {
        updateData.pageviews = pageviewsNum;
      }
    }

    // If there are updates to make, perform the upsert
    if (Object.keys(updateData).length > 0) {
      const { data, error } = await supabase
        .from("platform_stats")
        .upsert(
          {
            id: PLATFORM_STATS_ID,
            ...updateData,
          },
          {
            onConflict: "id",
          }
        )
        .select()
        .single();

      if (error) {
        console.error("Failed to update stats in database:", error);
        throw error;
      }

      return {
        visits: data.visits,
        pageviews: data.pageviews,
      };
    }

    // If no updates, return current stats
    return await getStatsStorage();
  } catch (error) {
    console.error("Error in updateStatsStorage:", error);
    throw error;
  }
}

// Export function to get stats directly
export async function getStatsStorage() {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from("platform_stats")
      .select("visits, pageviews")
      .eq("id", PLATFORM_STATS_ID)
      .single();

    if (error) {
      // If record doesn't exist, create it with default values
      if (error.code === "PGRST116") {
        const { data: newData, error: insertError } = await supabase
          .from("platform_stats")
          .insert({
            id: PLATFORM_STATS_ID,
            visits: 0,
            pageviews: 0,
          })
          .select("visits, pageviews")
          .single();

        if (insertError) {
          console.error("Failed to create stats record:", insertError);
          throw insertError;
        }

        return {
          visits: newData.visits || 0,
          pageviews: newData.pageviews || 0,
        };
      }

      console.error("Failed to get stats from database:", error);
      throw error;
    }

    return {
      visits: data?.visits || 0,
      pageviews: data?.pageviews || 0,
    };
  } catch (error) {
    console.error("Error in getStatsStorage:", error);
    // Return default values on error to prevent app crash
    return {
      visits: 0,
      pageviews: 0,
    };
  }
}

// GET /api/analytics/stats - Get statistics
export async function GET() {
  try {
    const stats = await getStatsStorage();
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Failed to get stats:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/analytics/stats - Update statistics
export async function POST(request) {
  try {
    const body = await request.json();
    const { visits, pageviews } = body;

    // Validate input
    if (visits !== undefined) {
      const visitsNum = parseInt(visits, 10);
      if (isNaN(visitsNum) || visitsNum < 0) {
        return NextResponse.json(
          { success: false, error: "Visits must be a positive number" },
          { status: 400 }
        );
      }
    }

    if (pageviews !== undefined) {
      const pageviewsNum = parseInt(pageviews, 10);
      if (isNaN(pageviewsNum) || pageviewsNum < 0) {
        return NextResponse.json(
          { success: false, error: "Pageviews must be a positive number" },
          { status: 400 }
        );
      }
    }

    // Update stats in database
    const updatedStats = await updateStatsStorage(visits, pageviews);

    return NextResponse.json({
      success: true,
      data: updatedStats,
      message: "Statistics updated successfully",
    });
  } catch (error) {
    console.error("Failed to update stats:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
