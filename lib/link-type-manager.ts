/**
 * Link Type Manager
 * Handles dofollow/nofollow link status for project submissions
 */

import { db } from "@/lib/supabase/database";

/**
 * Toggle link type between dofollow and nofollow
 * @param {string} projectId - The project ID
 * @param {string} adminId - The admin user ID making the change
 * @returns {Promise<Object>} Updated project
 */
export async function toggleLinkType(projectId, adminId) {
  const project = await db.findOne("apps", { id: projectId });
  
  if (!project) {
    throw new Error("Project not found");
  }

  const newLinkType = project.link_type === "dofollow" ? "nofollow" : "dofollow";
  const isUpgrading = newLinkType === "dofollow";

  const updateData: Record<string, any> = {
    link_type: newLinkType,
    dofollow_status: isUpgrading,
    // updated_at is handled by DB triggers
  };

  if (isUpgrading) {
    // Upgrading to dofollow
    updateData.dofollow_reason = "manual_upgrade";
    updateData.dofollow_awarded_at = new Date();
  } else {
    // Downgrading to nofollow - remove dofollow tracking
    updateData.dofollow_reason = null;
    updateData.dofollow_awarded_at = null;
  }

  await db.updateOne("apps", { id: projectId }, { $set: updateData });

  // Log the action
  await logLinkTypeChange(projectId, project.link_type, newLinkType, adminId, "manual");

  return { ...project, ...updateData };
}

/**
 * Manually upgrade a project to dofollow
 * @param {string} projectId - The project ID
 * @param {string} adminId - The admin user ID making the change
 * @returns {Promise<Object>} Updated project
 */
export async function upgradeToDofollow(projectId, adminId) {
  const project = await db.findOne("apps", { id: projectId });
  
  if (!project) {
    throw new Error("Project not found");
  }

  if (project.link_type === "dofollow") {
    return project; // Already dofollow
  }

  const updateData = {
    link_type: "dofollow",
    dofollow_status: true,
    dofollow_reason: "manual_upgrade",
    dofollow_awarded_at: new Date(),
    // updated_at is handled by DB triggers
  };

  await db.updateOne("apps", { id: projectId }, { $set: updateData });

  // Log the action
  await logLinkTypeChange(projectId, "nofollow", "dofollow", adminId, "manual_upgrade");

  return { ...project, ...updateData };
}

/**
 * Manually downgrade a project to nofollow
 * @param {string} projectId - The project ID
 * @param {string} adminId - The admin user ID making the change
 * @returns {Promise<Object>} Updated project
 */
export async function downgradeToNofollow(projectId, adminId) {
  const project = await db.findOne("apps", { id: projectId });
  
  if (!project) {
    throw new Error("Project not found");
  }

  if (project.link_type === "nofollow") {
    return project; // Already nofollow
  }

  const updateData = {
    link_type: "nofollow",
    dofollow_status: false,
    // updated_at is handled by DB triggers
  };

  // Remove dofollow tracking fields
  await db.updateOne(
    "apps", 
    { id: projectId }, 
    { 
      $set: updateData,
      $unset: {
        dofollow_reason: "",
        dofollow_awarded_at: ""
      }
    }
  );

  // Log the action
  await logLinkTypeChange(projectId, "dofollow", "nofollow", adminId, "manual_downgrade");

  return { ...project, ...updateData };
}

/**
 * Grant dofollow to a Standard project after admin approval.
 * Requires `backlink_verified === true` (set by /api/verify-badge).
 */
export async function grantDofollowOnApproval(projectId, adminId) {
  const project = await db.findOne("apps", { id: projectId });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.plan !== "standard") {
    throw new Error("grantDofollowOnApproval only applies to standard plan projects");
  }

  if (!project.backlink_verified) {
    throw new Error("Cannot grant dofollow: badge has not been verified for this project");
  }

  if (project.link_type === "dofollow") {
    return project;
  }

  const updateData = {
    link_type: "dofollow",
    dofollow_status: true,
    dofollow_reason: "verified_badge",
    dofollow_awarded_at: new Date(),
  };

  await db.updateOne("apps", { id: projectId }, { $set: updateData });
  await logLinkTypeChange(projectId, project.link_type || "nofollow", "dofollow", adminId, "verified_badge");

  return { ...project, ...updateData };
}

/**
 * Revert a Standard project's dofollow when its badge is no longer detected.
 */
export async function revokeDofollowForMissingBadge(projectId) {
  const project = await db.findOne("apps", { id: projectId });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.link_type !== "dofollow" || project.dofollow_reason !== "verified_badge") {
    return project;
  }

  const updateData = {
    link_type: "nofollow",
    dofollow_status: false,
    dofollow_reason: null,
    dofollow_awarded_at: null,
    backlink_verified: false,
    backlink_last_checked_at: new Date(),
  };

  await db.updateOne("apps", { id: projectId }, { $set: updateData });
  await logLinkTypeChange(projectId, "dofollow", "nofollow", "system", "badge_removed");

  return { ...project, ...updateData };
}

/**
 * Get link type statistics
 * @returns {Promise<Object>} Link type statistics
 */
export async function getLinkTypeStats() {
  const [totalProjects, dofollowCount, nofollowCount, verifiedBadge, manualUpgrades, premiumDofollow, weeklyWinners] = await Promise.all([
    db.count("apps", { status: "live" }),
    db.count("apps", { status: "live", link_type: "dofollow" }),
    db.count("apps", { status: "live", link_type: "nofollow" }),
    db.count("apps", { status: "live", dofollow_reason: "verified_badge" }),
    db.count("apps", { status: "live", dofollow_reason: "manual_upgrade" }),
    db.count("apps", { status: "live", dofollow_reason: "premium_plan" }),
    db.count("apps", { status: "live", dofollow_reason: "weekly_winner" }),
  ]);

  return {
    total: totalProjects,
    dofollow: dofollowCount,
    nofollow: nofollowCount,
    breakdown: {
      verified_badge: verifiedBadge,
      manual_upgrades: manualUpgrades,
      premium_plans: premiumDofollow,
      weekly_winners: weeklyWinners,
    },
    percentages: {
      dofollow: totalProjects > 0 ? ((dofollowCount / totalProjects) * 100).toFixed(2) : 0,
      nofollow: totalProjects > 0 ? ((nofollowCount / totalProjects) * 100).toFixed(2) : 0,
    },
  };
}

/**
 * Log link type changes for audit trail
 * @param {string} projectId
 * @param {string} fromType
 * @param {string} toType
 * @param {string} changedBy - User ID or "system"
 * @param {string} reason
 */
async function logLinkTypeChange(projectId, fromType, toType, changedBy, reason) {
  try {
    await db.insertOne("link_type_changes", {
      project_id: projectId,
      from_type: fromType,
      to_type: toType,
      changed_by: changedBy,
      reason: reason,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to log link type change:", error);
    // Don't throw - logging failure shouldn't block the main operation
  }
}

/**
 * Get link type change history for a project
 * @param {string} projectId
 * @returns {Promise<Array>} Change history
 */
export async function getLinkTypeHistory(projectId) {
  return await db.find("link_type_changes", { project_id: projectId }, { sort: { timestamp: -1 } });
}

/**
 * Check if a project is eligible for dofollow
 * @param {Object} project - The project object
 * @returns {Object} Eligibility status and reason
 */
export function checkDofollowEligibility(project) {
  if (project.plan === "premium") {
    return {
      eligible: true,
      reason: "Premium plan - automatic dofollow",
      requiresAction: false,
    };
  }

  if (project.link_type === "dofollow" && project.dofollow_reason === "verified_badge") {
    return {
      eligible: true,
      reason: "Verified badge embedded on user's site",
      requiresAction: false,
    };
  }

  if (project.link_type === "dofollow" && project.dofollow_reason === "manual_upgrade") {
    return {
      eligible: true,
      reason: "Manually upgraded by admin",
      requiresAction: false,
    };
  }

  if (project.plan === "standard" && project.backlink_verified) {
    return {
      eligible: true,
      reason: "Badge verified - awaiting admin approval",
      requiresAction: true,
    };
  }

  return {
    eligible: false,
    reason: "Standard plan - install our badge on your site to qualify for dofollow",
    requiresAction: true,
  };
}

/**
 * Bulk update link types (useful for migrations or corrections)
 * @param {Array} updates - Array of {projectId, linkType}
 * @param {string} adminId
 * @returns {Promise<Object>} Update results
 */
export async function bulkUpdateLinkTypes(updates, adminId) {
  const results = {
    successful: 0,
    failed: 0,
    errors: [],
  };

  for (const update of updates) {
    try {
      if (update.linkType === "dofollow") {
        await upgradeToDofollow(update.projectId, adminId);
      } else {
        await downgradeToNofollow(update.projectId, adminId);
      }
      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        projectId: update.projectId,
        error: error.message,
      });
    }
  }

  return results;
}

