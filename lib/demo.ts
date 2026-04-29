import { NextResponse } from "next/server";

/**
 * Demo mode utilities.
 *
 * When NEXT_PUBLIC_APP_MODE=demo, visitors can explore the admin panel
 * without authentication. All write operations are blocked — client-side
 * by DemoModeProvider's fetch interceptor, server-side by demoWriteResponse().
 */

// ── Check ────────────────────────────────────────────────────────────────────

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_APP_MODE === "demo";
}

// ── Fake user objects ────────────────────────────────────────────────────────

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

/** Matches the shape returned by supabase.auth.getUser() / useUser() hook. */
export const DEMO_AUTH_USER = {
  id: DEMO_USER_ID,
  email: "demo@ailaunch.space",
  user_metadata: {
    full_name: "Demo Admin",
    avatar_url: "",
  },
  app_metadata: {},
  aud: "authenticated",
  role: "authenticated",
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

// ── Server-side helpers (API routes) ─────────────────────────────────────────

/**
 * Auth bypass for admin GET endpoints.
 * Returns a fake admin session matching the checkAdminAuth() return shape,
 * or null when not in demo mode.
 */
export function demoAdminAuth(): { session: { user: { id: string; isAdmin: true } } } | null {
  if (!isDemoMode()) return null;
  return { session: { user: { id: DEMO_USER_ID, isAdmin: true } } };
}

/**
 * Write protection for admin API routes.
 * Returns a mock 200 response for non-GET requests in demo mode,
 * preventing any database writes even from direct API calls (curl etc.).
 * Returns null when not in demo mode or for GET requests.
 */
export function demoWriteResponse(): NextResponse | null {
  if (!isDemoMode()) return null;
  return NextResponse.json({
    success: true,
    demo: true,
    data: { id: crypto.randomUUID() },
  });
}
