import {
  AppRepository,
  UserRepository,
  VoteRepository,
} from "./repositories.js";

export class AppService {
  /**
   * Submit a new app for launch
   */
  static async submitApp(appData, userId) {
    try {
      // Set the user who submitted the app
      appData.submitted_by = userId;

      // Create the app
      const result = await AppRepository.createApp(appData);

      // Update user's total submissions count
      await UserRepository.updateUser(userId, {
        $inc: { totalSubmissions: 1 },
      });

      return { success: true, app: result };
    } catch (error) {
      console.error("Error submitting app:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get apps with pagination and filters
   */
  static async getApps(page = 1, limit = 20, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      const apps = await AppRepository.getApps(filters, { limit, skip });

      // Get total count for pagination
      const total = await AppRepository.collection.countDocuments(filters);

      return {
        success: true,
        apps,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error getting apps:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Vote for an app
   */
  static async voteForApp(userId, appId, voteType) {
    try {
      const result = await VoteRepository.createVote({
        user_id: userId,
        app_id: appId,
        vote_type: voteType,
      });

      return { success: true, result };
    } catch (error) {
      console.error("Error voting for app:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get app details with user vote status
   */
  static async getAppDetails(slug, userId = null) {
    try {
      const app = await AppRepository.getAppBySlug(slug);

      if (!app) {
        return { success: false, error: "App not found" };
      }

      // Increment view count
      await AppRepository.incrementViews(app._id.toString());

      // Get user's vote if logged in
      let userVote = null;
      if (userId) {
        userVote = await VoteRepository.getUserVoteForApp(
          userId,
          app._id.toString()
        );
      }

      // Get submitter details
      const submitter = await UserRepository.getUserById(app.submitted_by);

      return {
        success: true,
        app: {
          ...app,
          submitter: submitter
            ? {
                name: submitter.name,
                image: submitter.image,
              }
            : null,
          userVote: userVote?.vote_type || null,
        },
      };
    } catch (error) {
      console.error("Error getting app details:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get trending apps (most upvoted in last 3 days)
   */
  static async getTrendingApps(limit = 10) {
    try {
      const apps = await AppRepository.getTrendingApps(limit);
      return { success: true, apps };
    } catch (error) {
      console.error("Error getting trending apps:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get featured apps
   */
  static async getFeaturedApps(limit = 10) {
    try {
      const apps = await AppRepository.getFeaturedApps(limit);
      return { success: true, apps };
    } catch (error) {
      console.error("Error getting featured apps:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search apps
   */
  static async searchApps(query, page = 1, limit = 20) {
    try {
      const filters = { search: query, status: "approved" };
      return await this.getApps(page, limit, filters);
    } catch (error) {
      console.error("Error searching apps:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get apps by category
   */
  static async getAppsByCategory(category, page = 1, limit = 20) {
    try {
      const filters = { category, status: "approved" };
      return await this.getApps(page, limit, filters);
    } catch (error) {
      console.error("Error getting apps by category:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's dashboard data
   */
  static async getUserDashboard(userId) {
    try {
      const apps = await AppRepository.getAppsByUser(userId);
      const stats = await UserRepository.getUserStats(userId);

      return {
        success: true,
        data: {
          apps,
          stats,
        },
      };
    } catch (error) {
      console.error("Error getting user dashboard:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update app status (for admin/moderation)
   */
  static async updateAppStatus(appId, status, rejectionReason = null) {
    try {
      const updateData = { status };
      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }
      if (status === "approved") {
        updateData.publishedAt = new Date();
      }

      await AppRepository.updateApp(appId, updateData);
      return { success: true };
    } catch (error) {
      console.error("Error updating app status:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Feature/unfeature an app (for admin)
   */
  static async toggleFeatured(appId, featured) {
    try {
      await AppRepository.updateApp(appId, { featured });
      return { success: true };
    } catch (error) {
      console.error("Error toggling featured status:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a single app owned by a user (for editing)
   */
  static async getUserApp(appId, userId) {
    try {
      const app = await AppRepository.getAppById(appId);
      if (!app) {
        return { success: false, error: "App not found" };
      }

      if (app.submitted_by !== userId) {
        return {
          success: false,
          error: "Unauthorized: You can only view your own apps",
        };
      }

      return {
        success: true,
        data: app,
      };
    } catch (error) {
      console.error("Error getting user app:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user's own app
   */
  static async updateUserApp(appId, userId, updateData) {
    try {
      // First, verify that the app belongs to the user
      const app = await AppRepository.getAppById(appId);
      if (!app) {
        return { success: false, error: "App not found" };
      }

      if (app.submitted_by !== userId) {
        return {
          success: false,
          error: "Unauthorized: You can only edit your own apps",
        };
      }

      // Don't allow changing certain fields
      const allowedFields = [
        "name",
        "short_description",
        "full_description",
        "website_url",
        "logo_url",
        "screenshots",
        "video_url",
        "categories",
        "pricing",
        "contact_email",
        "backlink_url",
      ];

      const filteredUpdateData = {};
      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
          filteredUpdateData[key] = updateData[key];
        }
      });

      // Add updated timestamp
      filteredUpdateData.updatedAt = new Date();

      await AppRepository.updateApp(appId, filteredUpdateData);
      return { success: true };
    } catch (error) {
      console.error("Error updating user app:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete user's own app
   */
  static async deleteUserApp(appId, userId) {
    try {
      // First, verify that the app belongs to the user
      const app = await AppRepository.getAppById(appId);
      if (!app) {
        return { success: false, error: "App not found" };
      }

      if (app.submitted_by !== userId) {
        return {
          success: false,
          error: "Unauthorized: You can only delete your own apps",
        };
      }

      // Only allow deletion if the app is still pending or rejected
      if (app.status === "approved" || app.status === "live") {
        return {
          success: false,
          error: "Cannot delete approved or live apps. Please contact support.",
        };
      }

      await AppRepository.deleteApp(appId);
      return { success: true };
    } catch (error) {
      console.error("Error deleting user app:", error);
      return { success: false, error: error.message };
    }
  }
}

export class WeekService {
  /**
   * Get current week's apps with rankings
   */
  static async getCurrentWeekApps() {
    try {
      const currentWeekId = this.getCurrentWeekId();
      const apps = await AppRepository.getApps(
        { launch_week: currentWeekId, status: "approved" },
        { sort: { ranking_score: -1 } }
      );

      // Add ranking position
      const appsWithRanking = apps.map((app, index) => ({
        ...app,
        weekly_ranking: index + 1,
      }));

      return { success: true, apps: appsWithRanking };
    } catch (error) {
      console.error("Error getting current week apps:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available weeks for launch selection
   */
  static async getAvailableWeeks() {
    try {
      const weeks = [];
      const currentDate = new Date();

      // Generate next 8 weeks
      for (let i = 0; i < 8; i++) {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() + i * 7);

        // Set to Monday of the week
        const dayOfWeek = weekStart.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        weekStart.setDate(weekStart.getDate() + daysToMonday);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const year = weekStart.getFullYear();
        const weekNumber = Math.ceil(
          ((weekStart - new Date(year, 0, 1)) / 86400000 + 1) / 7
        );
        const weekId = `${year}-W${weekNumber.toString().padStart(2, "0")}`;

        weeks.push({
          id: weekId,
          label: `Week of ${weekStart.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })} - ${weekEnd.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`,
          start_date: weekStart,
          end_date: weekEnd,
        });
      }

      return { success: true, weeks };
    } catch (error) {
      console.error("Error getting available weeks:", error);
      return { success: false, error: error.message };
    }
  }

  static getCurrentWeekId() {
    const date = new Date();
    const year = date.getFullYear();
    const week = Math.ceil(((date - new Date(year, 0, 1)) / 86400000 + 1) / 7);
    return `${year}-W${week.toString().padStart(2, "0")}`;
  }
}

export class StatsService {
  /**
   * Get platform statistics
   */
  static async getPlatformStats() {
    try {
      const [totalApps, totalUsers, thisWeekApps, totalVotes] =
        await Promise.all([
          AppRepository.collection.countDocuments({ status: "approved" }),
          UserRepository.collection.countDocuments({}),
          AppRepository.collection.countDocuments({
            launch_week: WeekService.getCurrentWeekId(),
            status: "approved",
          }),
          VoteRepository.collection.countDocuments({}),
        ]);

      return {
        success: true,
        stats: {
          totalApps,
          totalUsers,
          thisWeekApps,
          totalVotes,
        },
      };
    } catch (error) {
      console.error("Error getting platform stats:", error);
      return { success: false, error: error.message };
    }
  }
}
