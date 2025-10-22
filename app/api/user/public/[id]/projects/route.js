import { NextResponse } from "next/server";
import { db } from "../../../../../libs/database.js";

// GET /api/user/public/[id]/projects - Get public user projects
export async function GET(request, { params }) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50"); // Show more projects by default
    const status = searchParams.get("status");
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const filter = { submitted_by: userId };
    
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
  } catch (error) {
    console.error("Public projects API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
