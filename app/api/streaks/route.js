import { NextResponse } from "next/server";
import { db } from "../../libs/database.js";
import { getSession } from "../../libs/auth-supabase.js";
import { getProgressToNextReward, REWARD_TIERS } from "../../libs/streaks.js";

// Helper to check if user has unlocked a specific reward tier
async function getUserRewardStatus(userId, tier) {
  const reward = await db.findOne("user_rewards", {
    user_id: userId,
    reward_tier: tier,
  });
  return reward ? { unlocked: true, isUsed: reward.is_used || false } : { unlocked: false, isUsed: false };
}

/**
 * GET /api/streaks - Get current user's streak data
 * GET /api/streaks?action=leaderboard - Get leaderboard
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Leaderboard endpoint
    if (action === "leaderboard") {
      const limit = parseInt(searchParams.get("limit") || "50", 10);
      
      // Get top users by current_streak (cumulative total days voted)
      // Only include users with at least 1 day streak
      const leaderboard = await db.find(
        "users",
        {
          current_streak: { $gt: 0 }
        },
        {
          sort: { current_streak: -1 },
          limit: limit,
          projection: {
            id: 1,
            full_name: 1,
            avatar_url: 1,
            current_streak: 1,
            vote_multiplier: 1,
            avatar_border_level: 1,
          },
        }
      );

      // Format leaderboard with rank
      const formattedLeaderboard = leaderboard.map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        username: user.full_name || "Anonymous",
        avatar: user.avatar_url,
        streak: user.current_streak || 0,
        voteMultiplier: user.vote_multiplier || 1,
        avatarBorderLevel: user.avatar_border_level || 0,
      }));

      return NextResponse.json({
        success: true,
        data: {
          leaderboard: formattedLeaderboard,
        },
      });
    }

    // User's own streak data
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: "Authentication required", 
          code: "UNAUTHORIZED" 
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user data
    const user = await db.findOne("users", { id: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const currentStreak = user.current_streak || 0;
    const longestStreak = user.longest_streak || 0;
    const voteMultiplier = user.vote_multiplier || 1;
    const avatarBorderLevel = user.avatar_border_level || 0;

    // Get progress to next reward
    const progress = getProgressToNextReward(currentStreak);

    // Get user's unlocked rewards
    const unlockedRewards = await db.find(
      "user_rewards",
      { user_id: userId },
      {
        sort: { reward_tier: -1 },
      }
    );

    // Format rewards
    const formattedRewards = unlockedRewards.map((reward) => ({
      id: reward.id,
      tier: reward.reward_tier,
      type: reward.reward_type,
      description: reward.metadata?.description || "",
      discountCode: reward.discount_code,
      isUsed: reward.is_used || false,
      usedAt: reward.used_at,
      createdAt: reward.created_at,
    }));

    // Get milestone status for all reward tiers
    const milestones = await Promise.all(
      REWARD_TIERS.map(async (tierConfig) => {
        const rewardStatus = await getUserRewardStatus(userId, tierConfig.tier);
        // Find the reward record for discount codes (from original unlockedRewards array)
        const rewardRecord = unlockedRewards.find((r) => r.reward_tier === tierConfig.tier);
        return {
          tier: tierConfig.tier,
          description: tierConfig.description,
          type: tierConfig.type,
          achieved: currentStreak >= tierConfig.tier,
          unlocked: rewardStatus.unlocked,
          isUsed: rewardStatus.isUsed,
          // Include reward record for discount codes
          reward: rewardRecord ? {
            id: rewardRecord.id,
            discount_code: rewardRecord.discount_code,
            is_used: rewardRecord.is_used || false,
          } : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        currentStreak, // Total days voted (cumulative, never resets)
        longestStreak, // Longest streak period (for stats)
        voteMultiplier,
        avatarBorderLevel,
        progressToNextReward: progress.percentage,
        daysRemaining: progress.daysRemaining,
        nextRewardTier: progress.nextTier?.tier,
        nextRewardDescription: progress.description,
        rewards: formattedRewards,
        milestones, // All milestone tiers with status
      },
    });
  } catch (error) {
    console.error("Streaks API error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/streaks/claim - Claim a reward
 */
export async function POST(request) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: "Authentication required", 
          code: "UNAUTHORIZED" 
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { rewardId } = body;

    if (!rewardId) {
      return NextResponse.json(
        { error: "Reward ID is required", code: "MISSING_REWARD_ID" },
        { status: 400 }
      );
    }

    // Get the reward
    const reward = await db.findOne("user_rewards", { id: rewardId });

    if (!reward) {
      return NextResponse.json(
        { error: "Reward not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Verify the reward belongs to the user
    if (reward.user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 403 }
      );
    }

    // Check if already used
    if (reward.is_used) {
      return NextResponse.json(
        { 
          error: "Reward already claimed", 
          code: "ALREADY_USED",
          data: {
            discountCode: reward.discount_code,
          }
        },
        { status: 400 }
      );
    }

    // Mark reward as used
    await db.updateOne(
      "user_rewards",
      { id: rewardId },
      {
        $set: {
          is_used: true,
          used_at: new Date(),
          updated_at: new Date(),
        },
      }
    );

    // Return the discount code (if it's a discount/free premium reward)
    return NextResponse.json({
      success: true,
      data: {
        rewardId: reward.id,
        discountCode: reward.discount_code,
        rewardType: reward.reward_type,
        message: reward.reward_type === 'discount' || reward.reward_type === 'free_premium'
          ? `Use code: ${reward.discount_code}`
          : "Reward claimed successfully",
      },
    });
  } catch (error) {
    console.error("Claim reward API error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
