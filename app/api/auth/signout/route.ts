import { NextResponse } from "next/server";
import { signOut } from '@/lib/supabase/auth';

export async function POST() {
  try {
    await signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sign out" },
      { status: 500 }
    );
  }
}

