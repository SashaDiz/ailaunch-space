import { NextResponse } from "next/server";
import { getSession } from "../../libs/auth-supabase.js";
import { notificationManager } from "../../libs/notification-service.js";

// POST /api/notifications - Send notification
export async function POST(request) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      emailType, 
      userEmail, 
      data, 
      appId, 
      competitionId, 
      metadata 
    } = body;

    // Validate required fields
    if (!emailType || !userEmail || !data) {
      return NextResponse.json(
        { error: "Missing required fields: emailType, userEmail, data" },
        { status: 400 }
      );
    }

    // Send notification
    const result = await notificationManager.sendNotification({
      userId: session.user.id,
      emailType,
      userEmail,
      data,
      appId,
      competitionId,
      metadata
    });

    return NextResponse.json({
      success: result.success,
      data: result.data,
      error: result.error
    });

  } catch (error) {
    console.error("Notification API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/notifications - Get user notification history
export async function GET(request) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const emailType = searchParams.get("emailType");

    // Get notification history
    const result = await notificationManager.getUserNotificationHistory(
      session.user.id,
      { limit, offset, emailType }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error("Notification history API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
