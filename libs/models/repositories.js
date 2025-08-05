import { db } from "../database.js";
import {
  validateApp,
  validateUser,
  validateVote,
  validateLaunchWeek,
} from "./schemas.js";
import { ObjectId } from "mongodb";

// Helper function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim("-");
};

// Helper function to get week ID from date
const getWeekId = (date) => {
  const year = date.getFullYear();
  const week = Math.ceil(((date - new Date(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${week.toString().padStart(2, "0")}`;
};

export class UserRepository {
  static collection = "users";

  static async createUser(userData) {
    const validatedData = validateUser(userData);
    return await db.insertOne(this.collection, validatedData);
  }

  static async getUserById(id) {
    return await db.findOne(this.collection, { _id: new ObjectId(id) });
  }

  static async getUserByEmail(email) {
    return await db.findOne(this.collection, { email });
  }

  static async updateUser(id, updateData) {
    const { _id, ...dataToUpdate } = updateData;
    return await db.updateOne(
      this.collection,
      { _id: new ObjectId(id) },
      { $set: dataToUpdate }
    );
  }

  static async deleteUser(id) {
    return await db.deleteOne(this.collection, { _id: new ObjectId(id) });
  }

  static async getUserStats(userId) {
    const apps = await AppRepository.getAppsByUser(userId);
    const totalViews = apps.reduce((sum, app) => sum + app.views, 0);
    const totalUpvotes = apps.reduce((sum, app) => sum + app.upvotes, 0);

    return {
      totalApps: apps.length,
      totalViews,
      totalUpvotes,
      approvedApps: apps.filter((app) => app.status === "approved").length,
      pendingApps: apps.filter((app) => app.status === "pending").length,
    };
  }
}

export class AppRepository {
  static collection = "apps";

  static async createApp(appData) {
    // Generate slug if not provided
    if (!appData.slug) {
      appData.slug = generateSlug(appData.name);
    }

    // Ensure slug is unique
    let baseSlug = appData.slug;
    let counter = 1;
    while (await this.getAppBySlug(appData.slug)) {
      appData.slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Set launch week if not provided
    if (!appData.launch_week) {
      appData.launch_week = getWeekId(new Date());
    }

    // Set launch date
    if (!appData.launch_date) {
      appData.launch_date = new Date();
    }

    const validatedData = validateApp(appData);
    return await db.insertOne(this.collection, validatedData);
  }

  static async getAppById(id) {
    return await db.findOne(this.collection, { _id: new ObjectId(id) });
  }

  static async getAppBySlug(slug) {
    return await db.findOne(this.collection, { slug });
  }

  static async getApps(filters = {}, options = {}) {
    const query = {};

    // Status filter
    if (filters.status) {
      query.status = filters.status;
    }

    // Category filter
    if (filters.category) {
      query.categories = { $in: [filters.category] };
    }

    // Week filter
    if (filters.week) {
      query.launch_week = filters.week;
    }

    // Featured filter
    if (filters.featured !== undefined) {
      query.featured = filters.featured;
    }

    // Search filter
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { short_description: { $regex: filters.search, $options: "i" } },
        { categories: { $in: [new RegExp(filters.search, "i")] } },
      ];
    }

    // Default sorting by ranking score
    const sortOptions = options.sort || { ranking_score: -1, createdAt: -1 };

    return await db.find(this.collection, query, {
      sort: sortOptions,
      limit: options.limit,
      skip: options.skip,
    });
  }

  static async getAppsByUser(userId) {
    return await db.find(
      this.collection,
      { submitted_by: userId },
      { sort: { createdAt: -1 } }
    );
  }

  static async updateApp(id, updateData) {
    const { _id, ...dataToUpdate } = updateData;
    return await db.updateOne(
      this.collection,
      { _id: new ObjectId(id) },
      { $set: dataToUpdate }
    );
  }

  static async deleteApp(id) {
    return await db.deleteOne(this.collection, { _id: new ObjectId(id) });
  }

  static async incrementViews(id) {
    return await db.updateOne(
      this.collection,
      { _id: new ObjectId(id) },
      { $inc: { views: 1 } }
    );
  }

  static async incrementClicks(id) {
    return await db.updateOne(
      this.collection,
      { _id: new ObjectId(id) },
      { $inc: { clicks: 1 } }
    );
  }

  static async getFeaturedApps(limit = 10) {
    return await db.find(
      this.collection,
      { featured: true, status: "approved" },
      { sort: { ranking_score: -1 }, limit }
    );
  }

  static async getTrendingApps(limit = 10) {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return await db.find(
      this.collection,
      {
        status: "approved",
        createdAt: { $gte: threeDaysAgo },
      },
      { sort: { upvotes: -1, views: -1 }, limit }
    );
  }

  static async getTopAppsThisWeek(limit = 10) {
    const currentWeek = getWeekId(new Date());

    return await db.find(
      this.collection,
      {
        launch_week: currentWeek,
        status: "approved",
      },
      { sort: { ranking_score: -1 }, limit }
    );
  }

  static async updateRankingScore(id, score) {
    return await db.updateOne(
      this.collection,
      { _id: new ObjectId(id) },
      { $set: { ranking_score: score } }
    );
  }
}

export class VoteRepository {
  static collection = "votes";

  static async createVote(voteData) {
    // Check if user already voted for this app
    const existingVote = await this.getUserVoteForApp(
      voteData.user_id,
      voteData.app_id
    );

    if (existingVote) {
      // Update existing vote if different
      if (existingVote.vote_type !== voteData.vote_type) {
        await this.updateVote(existingVote._id, {
          vote_type: voteData.vote_type,
        });
        await this.updateAppVoteCount(voteData.app_id);
        return { updated: true };
      }
      return { error: "Already voted" };
    }

    const validatedData = validateVote(voteData);
    const result = await db.insertOne(this.collection, validatedData);

    // Update app vote counts
    await this.updateAppVoteCount(voteData.app_id);

    return result;
  }

  static async getUserVoteForApp(userId, appId) {
    return await db.findOne(this.collection, {
      user_id: userId,
      app_id: appId,
    });
  }

  static async updateVote(id, updateData) {
    return await db.updateOne(
      this.collection,
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
  }

  static async deleteVote(id) {
    const vote = await db.findOne(this.collection, { _id: new ObjectId(id) });
    const result = await db.deleteOne(this.collection, {
      _id: new ObjectId(id),
    });

    if (vote) {
      await this.updateAppVoteCount(vote.app_id);
    }

    return result;
  }

  static async updateAppVoteCount(appId) {
    const upvotes = await db.count(this.collection, {
      app_id: appId,
      vote_type: "upvote",
    });

    const downvotes = await db.count(this.collection, {
      app_id: appId,
      vote_type: "downvote",
    });

    // Calculate ranking score (you can adjust this algorithm)
    const score = upvotes - downvotes * 0.5;

    await AppRepository.updateApp(appId, {
      upvotes,
      downvotes,
      ranking_score: score,
    });
  }

  static async getVotesForApp(appId) {
    return await db.find(this.collection, { app_id: appId });
  }
}

export class LaunchWeekRepository {
  static collection = "launch_weeks";

  static async createLaunchWeek(weekData) {
    const validatedData = validateLaunchWeek(weekData);
    return await db.insertOne(this.collection, validatedData);
  }

  static async getLaunchWeekById(id) {
    return await db.findOne(this.collection, { _id: new ObjectId(id) });
  }

  static async getLaunchWeekByWeekId(weekId) {
    return await db.findOne(this.collection, { week_id: weekId });
  }

  static async getCurrentWeek() {
    const currentWeekId = getWeekId(new Date());
    return await this.getLaunchWeekByWeekId(currentWeekId);
  }

  static async getUpcomingWeeks(limit = 5) {
    const now = new Date();
    return await db.find(
      this.collection,
      { start_date: { $gte: now } },
      { sort: { start_date: 1 }, limit }
    );
  }

  static async getPastWeeks(limit = 10) {
    const now = new Date();
    return await db.find(
      this.collection,
      { end_date: { $lt: now } },
      { sort: { start_date: -1 }, limit }
    );
  }

  static async updateLaunchWeek(id, updateData) {
    const { _id, ...dataToUpdate } = updateData;
    return await db.updateOne(
      this.collection,
      { _id: new ObjectId(id) },
      { $set: dataToUpdate }
    );
  }

  static async setWeekWinner(weekId, appId) {
    return await this.updateLaunchWeek(weekId, { winner: appId });
  }
}

export class CategoryRepository {
  static collection = "categories";

  static async getCategories() {
    return await db.find(
      this.collection,
      {},
      { sort: { sort_order: 1, name: 1 } }
    );
  }

  static async getCategoryBySlug(slug) {
    return await db.findOne(this.collection, { slug });
  }

  static async updateCategoryAppCount(categoryName) {
    const count = await db.count("apps", {
      categories: { $in: [categoryName] },
      status: "approved",
    });

    await db.updateOne(
      this.collection,
      { name: categoryName },
      { $set: { app_count: count } }
    );
  }
}

// Utility functions
export const generateWeekId = getWeekId;
