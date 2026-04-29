import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/database";
import { featureGuard } from "@/lib/features";
import { verifyBadgeOnUrl } from "@/lib/badge-verifier";
import { revokeDofollowForMissingBadge } from "@/lib/link-type-manager";

/**
 * GET /api/cron/reverify-badges
 *
 * Runs through every live Standard project that earned dofollow via the
 * verified-badge path and re-checks the user's site. If the badge is gone
 * (or now nofollow), we revert the listing to nofollow and log the change.
 *
 * Header: Authorization: Bearer ${CRON_SECRET}
 */
export async function GET(request: Request) {
  const guard = featureGuard("badges");
  if (guard) return guard;

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = {
    timestamp: now.toISOString(),
    checked: 0,
    revoked: 0,
    skipped: 0,
    errors: [] as Array<{ projectId: string; message: string }>,
  };

  let projects: Array<Record<string, any>> = [];
  try {
    projects = await db.find(
      "apps",
      {
        status: "live",
        plan: "standard",
        dofollow_reason: "verified_badge",
      },
      { sort: { backlink_last_checked_at: 1 }, limit: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to load projects", message: error?.message },
      { status: 500 }
    );
  }

  for (const project of projects) {
    if (!project.backlink_url) {
      results.skipped++;
      continue;
    }

    results.checked++;

    try {
      const verification = await verifyBadgeOnUrl(project.backlink_url);
      const stillVerified = verification.outcome.kind === "verified";

      if (!stillVerified) {
        await revokeDofollowForMissingBadge(project.id);
        results.revoked++;
      } else {
        await db.updateOne(
          "apps",
          { id: project.id },
          { $set: { backlink_last_checked_at: new Date() } }
        );
      }
    } catch (error: any) {
      results.errors.push({ projectId: project.id, message: error?.message ?? "unknown" });
    }
  }

  return NextResponse.json({ success: true, results });
}
