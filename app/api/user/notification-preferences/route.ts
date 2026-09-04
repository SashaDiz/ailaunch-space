import { NextResponse } from "next/server";

import { db } from "@/lib/supabase/database";
import { getServerSession } from "@/lib/supabase/auth-helpers";
import { MANDATORY_NOTIFICATIONS } from "@/lib/notification-types";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rate-limit";

/**
 * A user's own email notification preferences.
 *
 * The settings page used to read and write `users.notification_preferences`
 * straight from the browser, relying on RLS. RLS lets a signed-in user update
 * their own row, so the rule that some notifications cannot be switched off was
 * enforced in the browser only — anyone could disable the account-deletion or
 * submission-decision emails with a console one-liner. This route is where that
 * greyed-out checkbox becomes an actual control.
 */

/** Preferences are a flat map of notification type to boolean. */
type Preferences = Record<string, boolean>;

/** Mandatory types are forced on, whatever the caller sent. */
function enforceMandatory(preferences: Preferences): Preferences {
  const out: Preferences = { ...preferences };
  for (const type of MANDATORY_NOTIFICATIONS) out[type] = true;
  return out;
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await db.findOne(
    "users",
    { id: session.user.id },
    { projection: { notification_preferences: 1 } },
  );

  return NextResponse.json({
    preferences: enforceMandatory(user?.notification_preferences ?? {}),
    mandatory: [...MANDATORY_NOTIFICATIONS],
  });
}

export async function PATCH(request: Request) {
  const rateLimit = await checkRateLimit(request, "general");
  if (!rateLimit.allowed) {
    const limited = createRateLimitResponse(rateLimit);
    return new NextResponse(limited.body, { status: limited.status, headers: limited.headers });
  }

  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const submitted = (body as { preferences?: unknown })?.preferences;
  if (typeof submitted !== "object" || submitted === null || Array.isArray(submitted)) {
    return NextResponse.json({ error: "preferences must be an object" }, { status: 400 });
  }

  // Booleans only: a preference map is a set of switches, and anything else
  // reaching the JSONB column would come back as a truthy non-boolean later.
  const preferences: Preferences = {};
  for (const [key, value] of Object.entries(submitted)) {
    if (typeof value !== "boolean") {
      return NextResponse.json(
        { error: `preferences.${key} must be a boolean` },
        { status: 400 },
      );
    }
    preferences[key] = value;
  }

  const enforced = enforceMandatory(preferences);
  await db.updateOne(
    "users",
    { id: session.user.id },
    { $set: { notification_preferences: enforced } },
  );

  return NextResponse.json({ preferences: enforced, mandatory: [...MANDATORY_NOTIFICATIONS] });
}
