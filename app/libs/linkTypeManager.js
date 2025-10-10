/**
 * Link Type Manager
 * Handles dofollow/nofollow link status for directory submissions
 */

import { db } from "./database.js";

/**
 * Toggle link type between dofollow and nofollow
 * @param {string} directoryId - The directory ID
 * @param {string} adminId - The admin user ID making the change
 * @returns {Promise<Object>} Updated directory
 */
export async function toggleLinkType(directoryId, adminId) {
  const directory = await db.findOne("apps", { id: directoryId });
  
  if (!directory) {
    throw new Error("Directory not found");
  }

  const newLinkType = directory.link_type === "dofollow" ? "nofollow" : "dofollow";
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

  await db.updateOne("apps", { id: directoryId }, { $set: updateData });

  // Log the action
  await logLinkTypeChange(directoryId, directory.link_type, newLinkType, adminId, "manual");

  return { ...directory, ...updateData };
}

/**
 * Manually upgrade a directory to dofollow
 * @param {string} directoryId - The directory ID
 * @param {string} adminId - The admin user ID making the change
 * @returns {Promise<Object>} Updated directory
 */
export async function upgradeToDofollow(directoryId, adminId) {
  const directory = await db.findOne("apps", { id: directoryId });
  
  if (!directory) {
    throw new Error("Directory not found");
  }

  if (directory.link_type === "dofollow") {
    return directory; // Already dofollow
  }

  const updateData = {
    link_type: "dofollow",
    dofollow_status: true,
    dofollow_reason: "manual_upgrade",
    dofollow_awarded_at: new Date(),
    // updated_at is handled by DB triggers
  };

  await db.updateOne("apps", { id: directoryId }, { $set: updateData });

  // Log the action
  await logLinkTypeChange(directoryId, "nofollow", "dofollow", adminId, "manual_upgrade");

  return { ...directory, ...updateData };
}

/**
 * Manually downgrade a directory to nofollow
 * @param {string} directoryId - The directory ID
 * @param {string} adminId - The admin user ID making the change
 * @returns {Promise<Object>} Updated directory
 */
export async function downgradeToNofollow(directoryId, adminId) {
  const directory = await db.findOne("apps", { id: directoryId });
  
  if (!directory) {
    throw new Error("Directory not found");
  }

  if (directory.link_type === "nofollow") {
    return directory; // Already nofollow
  }

  const updateData = {
    link_type: "nofollow",
    dofollow_status: false,
    // updated_at is handled by DB triggers
  };

  // Remove dofollow tracking fields
  await db.updateOne(
    "apps", 
    { id: directoryId }, 
    { 
      $set: updateData,
      $unset: {
        dofollow_reason: "",
        dofollow_awarded_at: ""
      }
    }
  );

  // Log the action
  await logLinkTypeChange(directoryId, "dofollow", "nofollow", adminId, "manual_downgrade");

  return { ...directory, ...updateData };
}

/**
 * Award dofollow links to weekly competition winners
 * @param {string} competitionId - The competition ID (e.g., "2024-W01")
 * @returns {Promise<Array>} Array of updated directories
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
    sort: { upvotes: -1, created_at: 1 }, // Sort by upvotes descending, then by created date
    limit: 3
  });

  if (topThree.length === 0) {
    console.log(`No standard submissions found for competition ${competitionId}`);
    return [];
  }

  const updatedDirectories = [];

  // Award dofollow to each winner
  for (let i = 0; i < topThree.length; i++) {
    const position = i + 1; // 1, 2, or 3
    const directory = topThree[i];

    const updateData = {
      link_type: "dofollow",
      dofollow_status: true,
      dofollow_reason: "weekly_winner",
      dofollow_awarded_at: new Date(),
      weekly_winner: true,
      weekly_position: position,
      // updated_at is handled by DB triggers
    };

    await db.updateOne("apps", { id: directory.id }, { $set: updateData });

    // Log the action
    await logLinkTypeChange(
      directory.id,
      "nofollow",
      "dofollow",
      "system",
      `weekly_winner_position_${position}`
    );

    updatedDirectories.push({ ...directory, ...updateData });
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
  
  return updatedDirectories;
}

/**
 * Get link type statistics
 * @returns {Promise<Object>} Link type statistics
 */
export async function getLinkTypeStats() {
  const [totalDirectories, dofollowCount, nofollowCount, weeklyWinners, manualUpgrades, premiumDofollow] = await Promise.all([
    db.count("apps", { status: "live" }),
    db.count("apps", { status: "live", link_type: "dofollow" }),
    db.count("apps", { status: "live", link_type: "nofollow" }),
    db.count("apps", { status: "live", dofollow_reason: "weekly_winner" }),
    db.count("apps", { status: "live", dofollow_reason: "manual_upgrade" }),
    db.count("apps", { status: "live", dofollow_reason: "premium_plan" }),
  ]);

  return {
    total: totalDirectories,
    dofollow: dofollowCount,
    nofollow: nofollowCount,
    breakdown: {
      weekly_winners: weeklyWinners,
      manual_upgrades: manualUpgrades,
      premium_plans: premiumDofollow,
    },
    percentages: {
      dofollow: totalDirectories > 0 ? ((dofollowCount / totalDirectories) * 100).toFixed(2) : 0,
      nofollow: totalDirectories > 0 ? ((nofollowCount / totalDirectories) * 100).toFixed(2) : 0,
    },
  };
}

/**
 * Log link type changes for audit trail
 * @param {string} directoryId
 * @param {string} fromType
 * @param {string} toType
 * @param {string} changedBy - User ID or "system"
 * @param {string} reason
 */
async function logLinkTypeChange(directoryId, fromType, toType, changedBy, reason) {
  try {
    await db.insertOne("link_type_changes", {
      directory_id: directoryId,
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
 * Get link type change history for a directory
 * @param {string} directoryId
 * @returns {Promise<Array>} Change history
 */
export async function getLinkTypeHistory(directoryId) {
  return await db.find("link_type_changes", { directory_id: directoryId })
    .sort({ timestamp: -1 })
    .toArray();
}

/**
 * Check if a directory is eligible for dofollow
 * @param {Object} directory - The directory object
 * @returns {Object} Eligibility status and reason
 */
export function checkDofollowEligibility(directory) {
  if (directory.plan === "premium") {
    return {
      eligible: true,
      reason: "Premium plan - automatic dofollow",
      requiresAction: false,
    };
  }

  if (directory.weekly_winner) {
    return {
      eligible: true,
      reason: `Weekly winner (Position ${directory.weekly_position})`,
      requiresAction: false,
    };
  }

  if (directory.link_type === "dofollow" && directory.dofollow_reason === "manual_upgrade") {
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
 * @param {Array} updates - Array of {directoryId, linkType}
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
        await upgradeToDofollow(update.directoryId, adminId);
      } else {
        await downgradeToNofollow(update.directoryId, adminId);
      }
      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        directoryId: update.directoryId,
        error: error.message,
      });
    }
  }

  return results;
}

