/**
 * Link Type Manager
 * Handles dofollow/nofollow link status for project submissions
 */

import { db } from "./database.js";

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

  const updateData = {
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
 * Award dofollow links to weekly competition winners
 * @param {string} competitionId - The competition ID (e.g., "2024-W01")
 * @returns {Promise<Array>} Array of updated projects
 */
export async function awardDofollowToWeeklyWinners(competitionId) {
  // Get the competition
  const competition = await db.findOne("competitions", {
    competition_id: competitionId,
    type: "weekly",
  });

  if (!competition) {
    throw new Error("Competition not found");
  }

  // Get top 3 standard plan submissions by votes
  const topThree = await db.find("apps", {
    weekly_competition_id: competition.id, // UUID reference, not TEXT competition_id
    plan: "standard", // Only standard (FREE) plans compete for dofollow
    status: "live",
  }, {
    sort: { upvotes: -1, premium_badge: -1, created_at: -1 }, // Sort by upvotes DESC, then premium badge, then date DESC
    limit: 3
  });

  if (topThree.length === 0) {
    console.log(`No standard submissions found for competition ${competitionId}`);
    return [];
  }

  const updatedProjects = [];

  // Award dofollow to each winner
  for (let i = 0; i < topThree.length; i++) {
    const position = i + 1; // 1, 2, or 3
    const project = topThree[i];

    const updateData = {
      link_type: "dofollow",
      dofollow_status: true,
      dofollow_reason: "weekly_winner",
      dofollow_awarded_at: new Date(),
      weekly_winner: true,
      weekly_position: position,
      // updated_at is handled by DB triggers
    };

    await db.updateOne("apps", { id: project.id }, { $set: updateData });

    // Log the action
    await logLinkTypeChange(
      project.id,
      "nofollow",
      "dofollow",
      "system",
      `weekly_winner_position_${position}`
    );

    updatedProjects.push({ ...project, ...updateData });
  }

  // Update competition with winner IDs
  await db.updateOne(
    "competitions",
    { id: competition.id },
    {
      $set: {
        status: "completed",
        completed_at: new Date(),
        winner_id: topThree[0].id,
        runner_up_ids: topThree.slice(1).map(d => d.id),
        top_three_ids: topThree.map(d => d.id),
        // updated_at is handled by DB triggers
      },
    }
  );

  console.log(`Awarded dofollow to ${topThree.length} winners for competition ${competitionId}`);
  
  return updatedProjects;
}

/**
 * Get link type statistics
 * @returns {Promise<Object>} Link type statistics
 */
export async function getLinkTypeStats() {
  const [totalProjects, dofollowCount, nofollowCount, weeklyWinners, manualUpgrades, premiumDofollow] = await Promise.all([
    db.count("apps", { status: "live" }),
    db.count("apps", { status: "live", link_type: "dofollow" }),
    db.count("apps", { status: "live", link_type: "nofollow" }),
    db.count("apps", { status: "live", dofollow_reason: "weekly_winner" }),
    db.count("apps", { status: "live", dofollow_reason: "manual_upgrade" }),
    db.count("apps", { status: "live", dofollow_reason: "premium_plan" }),
  ]);

  return {
    total: totalProjects,
    dofollow: dofollowCount,
    nofollow: nofollowCount,
    breakdown: {
      weekly_winners: weeklyWinners,
      manual_upgrades: manualUpgrades,
      premium_plans: premiumDofollow,
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
  return await db.find("link_type_changes", { project_id: projectId })
    .sort({ timestamp: -1 })
    .toArray();
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

  if (project.weekly_winner) {
    return {
      eligible: true,
      reason: `Weekly winner (Position ${project.weekly_position})`,
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

  return {
    eligible: false,
    reason: "Standard plan - requires weekly win or manual upgrade",
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

