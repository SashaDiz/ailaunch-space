import { NextResponse } from "next/server";
import { db } from "../../../libs/database.js";

// GET /api/user/public/[id] - Get public user profile data
export async function GET(request, { params }) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user profile data from database
    const userProfile = await db.findOne("users", { id: userId });
    
    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get user's projects for stats
    const projects = await db.find("apps", { submitted_by: userId });
    const totalSubmissions = projects.length;
    const totalVotes = userProfile.total_votes || 0;

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
        updated_at: userProfile.updated_at,
        totalSubmissions,
        totalVotes,
      }
    });
  } catch (error) {
    console.error("Public profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
