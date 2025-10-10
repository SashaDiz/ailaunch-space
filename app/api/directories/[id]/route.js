import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "../../../libs/database.js";

// GET /api/directories/[id] - Get a single directory by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
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

    // Find the directory
    const directory = await db.findOne("apps", { id });
    
    if (!directory) {
      return NextResponse.json(
        { error: "Directory not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check if user has access to this directory
    // Users can access their own directories (including drafts)
    // Or live/approved directories
    const hasAccess = 
      directory.submitted_by === user.id || 
      directory.status === "live" || 
      directory.status === "approved";

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        directory,
      },
    });

  } catch (error) {
    console.error("Get directory error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

